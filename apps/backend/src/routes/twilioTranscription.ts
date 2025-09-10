import { Request, Response } from 'express';
import { WebSocketManager } from '../services/websocket';
import { LatencyProfiler } from '../services/latencyProfiler';
import { CallRecord } from '../models/CallRecord';
import { CallAnalysisService } from '../services/callAnalysisService';

interface TwilioTranscriptionData {
  CallSid: string;
  TranscriptionSid: string;
  TranscriptionText: string;
  TranscriptionStatus: string;
  TranscriptionUrl: string;
  RecordingSid: string;
  RecordingUrl: string;
}

export function twilioTranscriptionWebhook(
  wsManager: WebSocketManager,
  latencyProfiler: LatencyProfiler
) {
  return async (req: Request, res: Response) => {
    const endTiming = latencyProfiler.startTiming("twilio_transcription_webhook");

    try {
      const form = req.body;
      const transcriptionData = form.TranscriptionData;
      const track = form.Track; // inbound_track or outbound_track
      const callSid = form.CallSid;
      const fromNumber = form.From; // Phone number from Twilio
      let speaker = "Customer";
      if (track && track.includes("outbound")) speaker = "Agent";

      console.log(`📝 Twilio Transcription: ${callSid}`);
      console.log(`📱 From: ${fromNumber}`);
      console.log(`📊 Track: ${track}`);
      console.log(`👤 Speaker: ${speaker}`);
      console.log(`📄 Raw Data: ${transcriptionData}`);

      if (transcriptionData) {
        try {
          const data = JSON.parse(transcriptionData);
          const transcript = data.transcript;
          const confidence = data.confidence;

          console.log(`${speaker}: ${transcript} (Confidence: ${confidence})`);

          // Find the call record by phone number (more reliable than CallSid)
          let callRecord = null;
          
          if (fromNumber) {
            // First try to find by phone number and status
            callRecord = await CallRecord.findOne({
              phoneNumber: fromNumber,
              status: 'in_progress'
            }).sort({ timestamp: -1 });
            console.log(`🔍 Looking for call record by phone: ${fromNumber}`);
            
            // Debug: Check what call records exist for this phone number
            const allCallsForPhone = await CallRecord.find({ phoneNumber: fromNumber }).sort({ timestamp: -1 });
            console.log(`📊 Found ${allCallsForPhone.length} call records for phone ${fromNumber}:`);
            allCallsForPhone.forEach((call, index) => {
              console.log(`   ${index + 1}. ${call._id} - Status: ${call.status} - Transcript: "${call.transcript.substring(0, 50)}..."`);
            });
          }
          
          // If not found by phone number, try by CallSid as fallback
          if (!callRecord) {
            callRecord = await CallRecord.findOne({
              'metadata.callSid': callSid
            });
            console.log(`🔍 Looking for call record by CallSid: ${callSid}`);
          }
          
          // If still not found, try to find any recent in-progress call
          if (!callRecord) {
            console.log(`⚠️ Call record not found for ${fromNumber || callSid}, trying to find recent call`);
            callRecord = await CallRecord.findOne({
              status: 'in_progress'
            }).sort({ timestamp: -1 });
          }

          if (callRecord) {
            console.log(`✅ Found call record: ${callRecord._id} for phone: ${callRecord.phoneNumber}`);
            
            // Update the call record with the transcription
            const currentTranscript = callRecord.transcript || '';
            const updatedTranscript = currentTranscript + (currentTranscript ? ' ' : '') + `[${speaker}]: ${transcript}`;
            
            await CallRecord.findByIdAndUpdate(callRecord._id, {
              transcript: updatedTranscript,
              metadata: {
                ...callRecord.metadata,
                lastTranscription: {
                  speaker,
                  text: transcript,
                  confidence,
                  track,
                  timestamp: new Date()
                }
              }
            });

            console.log(`✅ Call record updated with transcription: ${callRecord._id}`);
            console.log(`📄 Updated transcript: "${updatedTranscript}"`);
            
            // Broadcast live transcript to connected agents
            const wsMessage = {
              type: 'live_transcript_chunk',
              callSid: callSid,
              speaker: speaker,
              transcript: transcript,
              fullTranscript: updatedTranscript,
              confidence: confidence,
              timestamp: new Date().toISOString()
            };

            wsManager.broadcastToAll(wsMessage);

            // Process the transcript for AI suggestions - optimized for token efficiency
            // Process every 500 characters to reduce API calls
            console.log(`🔍 Checking AI processing condition: length=${updatedTranscript.length}, condition=${updatedTranscript.length > 500}`);
            if (updatedTranscript.length > 30) {
              console.log(`🤖 Triggering AI processing for transcript length: ${updatedTranscript.length}`);
              try {
                await processTranscriptionForAI(callRecord, updatedTranscript, wsManager);
                console.log(`✅ AI processing completed successfully`);
              } catch (error) {
                console.error(`❌ Error in AI processing:`, error);
              }
            } else {
              console.log(`⏳ Skipping AI processing - transcript too short (${updatedTranscript.length} chars)`);
            }
          } else {
            console.log(`⚠️ Call record not found for CallSid: ${callSid}`);
          }

        } catch (e) {
          console.log("❌ Failed to parse TranscriptionData:", e);
          console.log("Raw transcription data:", transcriptionData);
        }
      } else {
        console.log("⚠️ No transcription data received");
      }

      res.status(200).send('OK');
      endTiming();

    } catch (error) {
      console.error('❌ Twilio transcription webhook error:', error);
      endTiming();
      res.status(500).send('Internal Server Error');
    }
  };
}

// Enhanced emotion analysis function
async function analyzeCustomerEmotions(transcript: string, callRecord: any): Promise<any> {
  try {
    // Get past customer transcripts for context
    const pastCalls = await CallRecord.find({ 
      clientId: callRecord.clientId,
      _id: { $ne: callRecord._id }
    })
    .sort({ timestamp: -1 })
    .limit(3)
    .lean();

    // Extract customer-only parts from past calls
    const pastCustomerTranscripts = pastCalls.map(call => {
      if (!call.transcript) return '';
      const customerParts = call.transcript
        .split(/\[Customer\]:|\[Agent\]:/)
        .filter((part, index) => index % 2 === 1) // Customer parts
        .join(' ')
        .trim();
      return customerParts;
    }).filter(t => t.length > 0);

    // Combine current and past customer transcripts
    const currentCustomerParts = transcript
      .split(/\[Customer\]:|\[Agent\]:/)
      .filter((part, index) => index % 2 === 1)
      .join(' ')
      .trim();

    const allCustomerTranscripts = [currentCustomerParts, ...pastCustomerTranscripts]
      .filter(t => t.length > 0)
      .join(' ');

    // Enhanced emotion analysis using keywords and patterns
    const emotions = analyzeEmotionKeywords(allCustomerTranscripts);
    
    return {
      mood: emotions.primaryMood,
      sentiment: emotions.sentimentScore,
      confidence: emotions.confidence,
      emotions: emotions.detectedEmotions,
      emotionScores: emotions.emotionScores,
      context: {
        currentTranscript: currentCustomerParts,
        pastTranscripts: pastCustomerTranscripts,
        conversationHistory: pastCalls.length
      }
    };
  } catch (error) {
    console.error('Error in emotion analysis:', error);
    return {
      mood: 'neutral',
      sentiment: 0.5,
      confidence: 0.3,
      emotions: ['neutral'],
      emotionScores: { neutral: 1.0 },
      context: { currentTranscript: transcript, pastTranscripts: [], conversationHistory: 0 }
    };
  }
}

function analyzeEmotionKeywords(text: string): any {
  const lowerText = text.toLowerCase();
  
  // Emotion keywords and their weights
  const emotionKeywords = {
    // Positive emotions
    happy: ['happy', 'excited', 'great', 'wonderful', 'fantastic', 'amazing', 'love', 'perfect', 'excellent', 'thrilled'],
    satisfied: ['satisfied', 'pleased', 'good', 'nice', 'okay', 'fine', 'acceptable', 'decent'],
    confident: ['confident', 'sure', 'certain', 'definitely', 'absolutely', 'convinced', 'positive'],
    
    // Negative emotions
    frustrated: ['frustrated', 'annoyed', 'irritated', 'upset', 'angry', 'mad', 'furious', 'disappointed'],
    confused: ['confused', 'unclear', 'don\'t understand', 'not sure', 'puzzled', 'lost', 'bewildered'],
    worried: ['worried', 'concerned', 'anxious', 'nervous', 'stressed', 'troubled', 'uneasy'],
    disappointed: ['disappointed', 'let down', 'disheartened', 'discouraged', 'disillusioned'],
    
    // Neutral emotions
    neutral: ['okay', 'fine', 'alright', 'sure', 'yes', 'no', 'maybe', 'perhaps'],
    curious: ['curious', 'interested', 'wondering', 'asking', 'questioning', 'inquisitive']
  };

  const emotionScores = {};
  let totalMatches = 0;

  // Calculate emotion scores
  Object.keys(emotionKeywords).forEach(emotion => {
    const keywords = emotionKeywords[emotion];
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    emotionScores[emotion] = matches;
    totalMatches += matches;
  });

  // Normalize scores
  Object.keys(emotionScores).forEach(emotion => {
    emotionScores[emotion] = totalMatches > 0 ? emotionScores[emotion] / totalMatches : 0;
  });

  // Determine primary mood and sentiment
  const primaryEmotion = Object.keys(emotionScores).reduce((a, b) => 
    emotionScores[a] > emotionScores[b] ? a : b
  );

  const sentimentScore = calculateSentimentScore(emotionScores);
  const primaryMood = mapEmotionToMood(primaryEmotion);
  const confidence = Math.min(1.0, totalMatches * 0.1 + 0.3);

  // Get top 3 emotions
  const detectedEmotions = Object.entries(emotionScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([emotion, score]) => ({ emotion, score }));

  return {
    primaryMood,
    sentimentScore,
    confidence,
    detectedEmotions: detectedEmotions.map(e => e.emotion),
    emotionScores,
    totalMatches
  };
}

function calculateSentimentScore(emotionScores: any): number {
  const positiveEmotions = ['happy', 'satisfied', 'confident'];
  const negativeEmotions = ['frustrated', 'confused', 'worried', 'disappointed'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveEmotions.forEach(emotion => {
    positiveScore += emotionScores[emotion] || 0;
  });
  
  negativeEmotions.forEach(emotion => {
    negativeScore += emotionScores[emotion] || 0;
  });
  
  if (positiveScore + negativeScore === 0) return 0.5;
  
  return positiveScore / (positiveScore + negativeScore);
}

function mapEmotionToMood(emotion: string): string {
  const moodMap = {
    'happy': 'positive',
    'satisfied': 'positive',
    'confident': 'positive',
    'frustrated': 'negative',
    'confused': 'negative',
    'worried': 'negative',
    'disappointed': 'negative',
    'neutral': 'neutral',
    'curious': 'neutral'
  };
  
  return moodMap[emotion] || 'neutral';
}

// Enhanced processTranscriptionForAI function
async function processTranscriptionForAI(
  callRecord: CallRecord, 
  transcript: string, 
  wsManager: WebSocketManager
) {
  try {
    console.log(`\n🤖 ===== STARTING ENHANCED AI PROCESSING =====`);
    console.log(`🤖 Processing transcription for AI suggestions: ${JSON.stringify(callRecord)}`);
    console.log(`📄 Current transcript: "${transcript}"`);
    console.log(`📊 Transcript length: ${transcript.length} characters`);
    
    // Import the AI processing functions
    const { determineCallOutcome } = await import('./twilioWebhook');
    
    // Enhanced emotion analysis with past context
    const moodAnalysis = await analyzeCustomerEmotions(transcript, callRecord);
    console.log(`😊 Enhanced Mood Analysis:`, moodAnalysis);
    
    // Get comprehensive client history with customer-only transcripts
    const clientHistory = await CallRecord.find({ clientId: callRecord.clientId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    // Extract customer conversation patterns
    const customerConversationHistory = clientHistory.map(call => {
      if (!call.transcript) return null;
      const customerParts = call.transcript
        .split(/\[Customer\]:|\[Agent\]:/)
        .filter((part, index) => index % 2 === 1)
        .join(' ')
        .trim();
      return {
        timestamp: call.timestamp,
        transcript: customerParts,
        mood: call.mood,
        sentiment: call.sentiment,
        duration: call.duration
      };
    }).filter(call => call && call.transcript.length > 0);

    // Generate enhanced AI sales suggestions
    const salesSuggestions = await generateEnhancedSalesSuggestions(
      transcript,
      moodAnalysis,
      customerConversationHistory,
      callRecord.phoneNumber
    );

    console.log(`\n🤖 ===== ENHANCED AI RESPONSE ANALYSIS =====`);
    console.log(`📞 Call ID: ${callRecord._id}`);
    console.log(`📱 Phone: ${callRecord.phoneNumber}`);
    console.log(`📄 Transcript: "${transcript}"`);
    console.log(`😊 Mood: ${moodAnalysis.mood} (${moodAnalysis.sentiment})`);
    console.log(`🎭 Emotions: ${moodAnalysis.emotions.join(', ')}`);
    console.log(`🔍 Raw AI Response:`, JSON.stringify(salesSuggestions, null, 2));
    
    // Parse suggestions
    let suggestionsArray = [];
    if (salesSuggestions && salesSuggestions.suggestions) {
      if (Array.isArray(salesSuggestions.suggestions)) {
        suggestionsArray = salesSuggestions.suggestions;
      } else if (typeof salesSuggestions.suggestions === 'string') {
        try {
          suggestionsArray = JSON.parse(salesSuggestions.suggestions);
        } catch (e) {
          console.error('❌ Failed to parse suggestions string:', e);
          suggestionsArray = [];
        }
      }
    }
    
    console.log(`💡 Generated ${suggestionsArray.length} enhanced AI suggestions:`);
    console.log(`\n📋 ENHANCED SUGGESTIONS DETAILS:`);
    suggestionsArray.forEach((suggestion, index) => {
      console.log(`\n   ${index + 1}. [${suggestion.type.toUpperCase()}]`);
      console.log(`      💬 Text: "${suggestion.text}"`);
      console.log(`      🎯 Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
      console.log(`      📤 Deliver as: ${suggestion.deliver_as}`);
      console.log(`      🆔 Offer ID: ${suggestion.offer_id}`);
      console.log(`      😊 Customer Mood: ${suggestion.customer_mood || 'N/A'}`);
      if (suggestion.reasoning) {
        console.log(`      🧠 Reasoning: ${suggestion.reasoning}`);
      }
    });
    console.log(`\n🚀 Broadcasting to ${wsManager.getConnectionCount()} connected clients...`);
    console.log(`==========================================\n`);

    // Perform comprehensive call analysis
    let callAnalysis = null;
    if (transcript.length > 100) {
      try {
        console.log('🔍 Performing comprehensive call analysis...');
        callAnalysis = await CallAnalysisService.analyzeCall(transcript, callRecord.duration || 0);
        console.log('✅ Call analysis completed:', callAnalysis.summary);
      } catch (error) {
        console.error('❌ Error in call analysis:', error);
      }
    }

    // Generate AI agent feedback
    let agentFeedback = null;
    if (transcript.length > 100 && callAnalysis) {
      try {
        console.log('🤖 Generating AI agent feedback...');
        agentFeedback = await CallAnalysisService.generateAgentFeedback(transcript, callAnalysis);
        console.log('✅ Agent feedback generated:', agentFeedback.overallFeedback);
      } catch (error) {
        console.error('❌ Error generating agent feedback:', error);
      }
    }

    // Generate AI call summary
    let callSummary = null;
    if (transcript.length > 100 && callAnalysis && agentFeedback) {
      try {
        console.log('📝 Generating AI call summary...');
        callSummary = await CallAnalysisService.generateCallSummary(transcript, callAnalysis, agentFeedback);
        console.log('✅ Call summary generated:', callSummary.overallAssessment);
      } catch (error) {
        console.error('❌ Error generating call summary:', error);
      }
    }

    // Generate enhanced analysis
    let enhancedAnalysis = null;
    if (transcript.length > 50) {
      try {
        console.log('🔍 Generating enhanced analysis...');
        enhancedAnalysis = await CallAnalysisService.generateEnhancedAnalysis(transcript);
        console.log('✅ Enhanced analysis generated:', enhancedAnalysis.moodAnalysis?.mood);
      } catch (error) {
        console.error('❌ Error generating enhanced analysis:', error);
      }
    }

    // Set call end time if not already set
    const callEndTime = callRecord.callEndTime || new Date();
    
    // Calculate duration from callStartTime and callEndTime if available
    let calculatedDuration = callRecord.duration;
    if (callRecord.callStartTime && callEndTime) {
      const startTime = new Date(callRecord.callStartTime).getTime();
      const endTime = new Date(callEndTime).getTime();
      calculatedDuration = Math.round((endTime - startTime) / 1000); // Convert to seconds
    }

    // Update call record with enhanced analysis
    const updateData: any = {
      mood: moodAnalysis.mood,
      sentiment: moodAnalysis.sentiment,
      aiSuggestions: suggestionsArray,
      outcome: determineCallOutcome(suggestionsArray, moodAnalysis),
      callEndTime: callEndTime,
      duration: calculatedDuration,
      emotionAnalysis: {
        emotions: moodAnalysis.emotions,
        emotionScores: moodAnalysis.emotionScores,
        confidence: moodAnalysis.confidence
      }
    };

    if (callAnalysis) {
      updateData.callAnalysis = callAnalysis;
    }

    if (agentFeedback) {
      updateData.agentFeedback = agentFeedback;
    }

    if (callSummary) {
      updateData.callSummary = callSummary;
    }

    if (enhancedAnalysis) {
      updateData.enhancedAnalysis = enhancedAnalysis;
    }

    await CallRecord.findByIdAndUpdate(callRecord._id, updateData);

    // Broadcast enhanced live analysis with emotion data
    const liveAnalysisMessage = {
      type: 'live_analysis',
      callSid: callRecord.metadata?.callSid,
      transcript: transcript,
      moodAnalysis: moodAnalysis,
      suggestions: suggestionsArray,
      enhancedAnalysis: enhancedAnalysis,
      emotionGraph: {
        emotions: moodAnalysis.emotions,
        scores: moodAnalysis.emotionScores,
        primaryMood: moodAnalysis.mood,
        sentiment: moodAnalysis.sentiment
      },
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToAll(liveAnalysisMessage);

    // Enhanced conversation message
    const wsMessage = {
      type: 'transcription_processed',
      conversationId: callRecord.clientId.toString(),
      callRecord: {
        id: callRecord._id,
        clientId: callRecord.clientId,
        phoneNumber: callRecord.phoneNumber,
        timestamp: callRecord.timestamp,
        duration: callRecord.duration,
        transcript: transcript,
        mood: moodAnalysis.mood,
        sentiment: moodAnalysis.sentiment,
        emotions: moodAnalysis.emotions,
        emotionScores: moodAnalysis.emotionScores,
        direction: callRecord.direction,
        aiSuggestions: suggestionsArray,
        outcome: determineCallOutcome(suggestionsArray, moodAnalysis),
        metadata: callRecord.metadata
      },
      moodAnalysis,
      emotionGraph: {
        emotions: moodAnalysis.emotions,
        scores: moodAnalysis.emotionScores,
        primaryMood: moodAnalysis.mood,
        sentiment: moodAnalysis.sentiment
      },
      clientHistory: customerConversationHistory.slice(-3),
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToConversation(callRecord.clientId.toString(), wsMessage);

    console.log(`✅ Enhanced AI suggestions broadcasted to all connected clients: ${suggestionsArray.length} suggestions`);

  } catch (error) {
    console.error('❌ Error processing transcription for AI:', error);
  }
}

// Enhanced sales suggestions function
async function generateEnhancedSalesSuggestions(
  transcript: string,
  moodAnalysis: any,
  customerHistory: any[],
  phoneNumber: string
): Promise<any> {
  try {
    const { OpenAIClient } = await import('../services/openaiClient');
    const { FoodHubService } = await import('../services/foodhubService');
    
    const openaiClient = new OpenAIClient();
    const foodhubService = new FoodHubService();

    if (!openaiClient.client) {
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    // Get relevant FoodHub context
    const relevantContext = await foodhubService.extractRelevantContext(transcript);
    const productInfo = foodhubService.getProductInfo(transcript);

    // Create enhanced prompt with customer conversation history
    const prompt = `You are an expert FoodHub Sales Agent. Analyze the customer's current state and conversation history to provide CRISP, ACTIONABLE suggestions.

CURRENT CUSTOMER TRANSCRIPT: "${transcript}"

CUSTOMER EMOTION ANALYSIS:
- Primary Mood: ${moodAnalysis.mood}
- Sentiment Score: ${moodAnalysis.sentiment}
- Detected Emotions: ${moodAnalysis.emotions.join(', ')}
- Emotion Confidence: ${moodAnalysis.confidence}

CUSTOMER CONVERSATION HISTORY:
${customerHistory.map((call, i) => 
  `Call ${i + 1} (${call.timestamp}): "${call.transcript}" - Mood: ${call.mood}, Sentiment: ${call.sentiment}`
).join('\n')}

FOODHUB CONTEXT: ${relevantContext}

INSTRUCTIONS:
1. Consider the customer's CURRENT emotional state and past conversation patterns
2. Provide 1-2 CRISP, specific suggestions that directly address their current needs
3. Each suggestion should be actionable and specific to their mood
4. Reference their conversation history to show understanding
5. Be empathetic to their emotional state
6. Include the customer's current mood in each suggestion

OUTPUT FORMAT (JSON only):
{
  "suggestions": [
    {
      "text": "Specific, actionable suggestion based on their current mood and history",
      "type": "solution|question|offer|follow_up",
      "confidence": 0.85,
      "deliver_as": "immediate_response|follow_up_question|next_step",
      "offer_id": "specific_offer_id",
      "customer_mood": "${moodAnalysis.mood}",
      "reasoning": "Why this suggestion fits their current emotional state and history"
    }
  ],
  "customer_insights": {
    "emotional_state": "Brief description of their current emotional state",
    "conversation_pattern": "Pattern observed in their conversation history",
    "recommended_approach": "Overall recommended approach for this customer"
  }
}`;

    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: "system",
          content: "You are an expert FoodHub Sales Agent. Provide crisp, actionable suggestions based on customer emotions and conversation history. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedResponse = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', content);
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    return parsedResponse;

  } catch (error) {
    console.error('Error generating enhanced sales suggestions:', error);
    return generateMockSalesSuggestions(transcript, moodAnalysis);
  }
}

function generateMockSalesSuggestions(transcript: string, moodAnalysis: any): any {
  return {
    suggestions: [
      {
        text: "I understand you're looking for a solution. Let me show you how FoodHub can help your restaurant grow.",
        type: "solution",
        confidence: 0.7,
        deliver_as: "immediate_response",
        offer_id: "general_solution",
        customer_mood: moodAnalysis.mood,
        reasoning: "Generic response for fallback scenario"
      }
    ],
    customer_insights: {
      emotional_state: moodAnalysis.mood,
      conversation_pattern: "No history available",
      recommended_approach: "Standard approach"
    }
  };
}