import { Request, Response } from 'express';
import { WebSocketManager } from '../services/websocket';
import { LatencyProfiler } from '../services/latencyProfiler';
import { CallRecord } from '../models/CallRecord';
import { CallAnalysisService } from '../services/callAnalysisService';
import { rateLimiter } from '../services/rateLimiter';

// Global type declaration for processing states and caching
declare global {
  var processingStates: Map<string, {
    lastProcessed: number;
    lastSpeaker: string;
    transcriptBuffer: string;
    processingCount: number;
    lastMeaningfulChunk: string;
    cooldownUntil: number;
  }> | undefined;
  var emotionCache: Map<string, any> | undefined;
  var autoCompleteTimeouts: Map<string, NodeJS.Timeout> | undefined;
}

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

            // Smart AI processing with conversation state awareness
            await handleSmartAIProcessing(callRecord, updatedTranscript, wsManager, speaker);
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

  const emotionScores: Record<string, number> = {};
  let totalMatches = 0;

  // Calculate emotion scores
  Object.keys(emotionKeywords).forEach(emotion => {
    const keywords = emotionKeywords[emotion as keyof typeof emotionKeywords];
    const matches = keywords.filter((keyword: string) => lowerText.includes(keyword)).length;
    emotionScores[emotion] = matches;
    totalMatches += matches;
  });

  // Normalize scores
  Object.keys(emotionScores).forEach(emotion => {
    emotionScores[emotion] = totalMatches > 0 ? emotionScores[emotion] / totalMatches : 0;
  });

  // Determine primary mood and sentiment
  const primaryEmotion = Object.keys(emotionScores).reduce((a: string, b: string) => 
    emotionScores[a] > emotionScores[b] ? a : b
  );

  const sentimentScore = calculateSentimentScore(emotionScores);
  const primaryMood = mapEmotionToMood(primaryEmotion);
  const confidence = Math.min(1.0, totalMatches * 0.1 + 0.3);

  // Get top 3 emotions
  const detectedEmotions = Object.entries(emotionScores)
    .sort(([,a], [,b]) => (b as number) - (a as number))
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
  const moodMap: Record<string, string> = {
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

// Smart AI processing with conversation state awareness and caching
async function handleSmartAIProcessing(
  callRecord: any,
  updatedTranscript: string,
  wsManager: WebSocketManager,
  speaker: string
) {
  try {
    const callId = callRecord._id.toString();
    const now = Date.now();
    
    // Get or create processing state for this call
    if (!global.processingStates) {
      global.processingStates = new Map();
    }
    
    let processingState = global.processingStates.get(callId);
    if (!processingState) {
      processingState = {
        lastProcessed: 0,
        lastSpeaker: '',
        transcriptBuffer: '',
        processingCount: 0,
        lastMeaningfulChunk: '',
        cooldownUntil: 0
      };
      global.processingStates.set(callId, processingState);
    }
    
    // Update buffer with new transcript
    processingState.transcriptBuffer = updatedTranscript;
    processingState.lastSpeaker = speaker;
    
    // Check if we should process based on smart conditions
    const shouldProcess = shouldTriggerAIProcessing(processingState, updatedTranscript, speaker, now);
    
    if (shouldProcess) {
      console.log(`🤖 Smart AI processing triggered for call ${callId}`);
      console.log(`📊 Processing stats: count=${processingState.processingCount}, buffer=${updatedTranscript.length} chars`);
      
      // Update processing state
      processingState.lastProcessed = now;
      processingState.processingCount++;
      processingState.lastMeaningfulChunk = updatedTranscript;
      processingState.cooldownUntil = now + 2000; // 2-second cooldown (optimized for speed)
      
      // Process with enhanced context
      await processTranscriptionForAI(callRecord, updatedTranscript, wsManager);
      
      console.log(`✅ Smart AI processing completed for call ${callId}`);
    } else {
      console.log(`⏳ Smart AI processing skipped for call ${callId} - ${getSkipReason(processingState, updatedTranscript, speaker, now)}`);
    }
    
  } catch (error) {
    console.error(`❌ Error in smart AI processing:`, error);
  }
}

// Determine if AI processing should be triggered based on smart conditions
function shouldTriggerAIProcessing(
  state: any,
  transcript: string,
  speaker: string,
  now: number
): boolean {
  // 1. Cooldown check - OPTIMIZED to 2 seconds for faster suggestions
  if (now < state.cooldownUntil) {
    return false;
  }
  
  // 2. Minimum transcript length - REDUCED to 50 for faster triggering
  if (transcript.length < 50) {
    return false;
  }
  
  // 3. AGGRESSIVE: Trigger on ANY customer speech (removed agent dependency)
  if (speaker === 'Customer') {
    return true;
  }
  
  // 4. Meaningful conversation chunks - REDUCED to 100 characters for faster processing
  const newContent = transcript.substring(state.lastMeaningfulChunk.length);
  if (newContent.length >= 100) {
    return true;
  }
  
  // 5. Question detection - process when customer asks questions
  const questionIndicators = ['?', 'how', 'what', 'when', 'where', 'why', 'can you', 'do you', 'is it'];
  const hasQuestion = questionIndicators.some(indicator => 
    newContent.toLowerCase().includes(indicator)
  );
  if (hasQuestion) {
    return true;
  }
  
  // 6. Sentiment change detection - process when mood shifts
  const sentimentKeywords = {
    positive: ['great', 'excellent', 'love', 'amazing', 'perfect', 'yes', 'sure'],
    negative: ['no', 'not', 'problem', 'issue', 'concern', 'worried', 'expensive'],
    urgent: ['urgent', 'asap', 'quickly', 'immediately', 'now', 'today']
  };
  
  const hasSentimentChange = Object.values(sentimentKeywords).some(keywords =>
    keywords.some(keyword => newContent.toLowerCase().includes(keyword))
  );
  
  if (hasSentimentChange) {
    return true;
  }
  
  // 7. Rate limiting - max 1 processing per 8 seconds, max 20 per call
  if (state.processingCount >= 20) {
    return false;
  }
  
  return false;
}

// Get human-readable skip reason for debugging
function getSkipReason(
  state: any,
  transcript: string,
  speaker: string,
  now: number
): string {
  if (now < state.cooldownUntil) {
    const remaining = Math.ceil((state.cooldownUntil - now) / 1000);
    return `cooldown (${remaining}s remaining)`;
  }
  if (transcript.length < 150) {
    return `transcript too short (${transcript.length} chars)`;
  }
  if (state.processingCount >= 20) {
    return `rate limit reached (${state.processingCount}/20)`;
  }
  return 'no meaningful triggers detected';
}

// Enhanced processTranscriptionForAI function
async function processTranscriptionForAI(
  callRecord: any, 
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
    
    // 🚀 FAST MODE: Generate immediate suggestions
    const fastSuggestions = await generateFastSuggestions(transcript, moodAnalysis);
    console.log('⚡ Fast suggestions generated');
    
    // Parse fast suggestions
    let fastSuggestionsArray = [];
    if (fastSuggestions && fastSuggestions.suggestions) {
      fastSuggestionsArray = Array.isArray(fastSuggestions.suggestions) 
        ? fastSuggestions.suggestions 
        : [];
    }

    // 🚀 IMMEDIATE: Send fast suggestions right away via WebSocket
    const immediateFastSuggestionsMessage = {
      type: 'instant_suggestions',
      callSid: callRecord.metadata?.callSid,
      suggestions: fastSuggestionsArray,
      moodAnalysis: moodAnalysis,
      metadata: {
        reason: 'fast_mode_suggestions',
        used_context_ids: [],
        timestamp: new Date().toISOString(),
        processingTime: Date.now()
      }
    };
    wsManager.broadcastToAll(immediateFastSuggestionsMessage);
    console.log('⚡ IMMEDIATE fast suggestions sent via WebSocket');
    
    // 🚀 PARALLEL PROCESSING: Get comprehensive client history with customer-only transcripts
    const clientHistoryPromise = CallRecord.find({ clientId: callRecord.clientId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
    
    // Start parallel processing (resolve when needed)
    const clientHistory = await clientHistoryPromise;
    console.log('🚀 Client history loaded in parallel');

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
    suggestionsArray.forEach((suggestion: any, index: number) => {
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
    console.log(`\n🚀 Broadcasting IMMEDIATE suggestions to ${wsManager.getConnectionCount()} connected clients...`);
    console.log(`==========================================\n`);

    // 🚀 IMMEDIATE: Send suggestions right away via WebSocket
    const immediateSuggestionsMessage = {
      type: 'instant_suggestions',
      callSid: callRecord.metadata?.callSid,
      suggestions: suggestionsArray,
      moodAnalysis: moodAnalysis,
      metadata: {
        reason: 'immediate_suggestions',
        used_context_ids: [],
        timestamp: new Date().toISOString(),
        processingTime: Date.now()
      }
    };
    wsManager.broadcastToAll(immediateSuggestionsMessage);
    console.log('⚡ IMMEDIATE suggestions sent via WebSocket');

    // 🎯 ENHANCED SUGGESTIONS: Send enhanced suggestions with full context
    setImmediate(async () => {
      try {
        console.log('🎯 Starting enhanced suggestions processing...');
        
        // Send enhanced suggestions if available
        if (salesSuggestions && salesSuggestions.suggestions) {
          let enhancedSuggestionsArray = [];
          if (Array.isArray(salesSuggestions.suggestions)) {
            enhancedSuggestionsArray = salesSuggestions.suggestions;
          } else if (typeof salesSuggestions.suggestions === 'string') {
            try {
              enhancedSuggestionsArray = JSON.parse(salesSuggestions.suggestions);
            } catch (e) {
              console.error('❌ Failed to parse enhanced suggestions:', e);
              enhancedSuggestionsArray = [];
            }
          }

          if (enhancedSuggestionsArray.length > 0) {
            const enhancedSuggestionsMessage = {
              type: 'enhanced_suggestions',
              callSid: callRecord.metadata?.callSid,
              suggestions: enhancedSuggestionsArray,
              metadata: {
                reason: 'enhanced_mode_suggestions',
                timestamp: new Date().toISOString(),
                processingTime: Date.now()
              }
            };
            wsManager.broadcastToAll(enhancedSuggestionsMessage);
            console.log('🎯 Enhanced suggestions sent via WebSocket');
          }
        }
      } catch (enhancedError) {
        console.error('❌ Error in enhanced suggestions processing:', enhancedError);
      }
    });

    // ⚡ LIVE PROCESSING COMPLETE - Heavy analysis moved to call end
    console.log('⚡ Live suggestion processing complete - heavy analysis deferred to call end');
    // Note: Call summary, agent feedback, and full analysis will be triggered at call end only
    
    // 🕒 AUTO-COMPLETE DETECTOR: Check if call should be auto-completed after inactivity
    scheduleAutoCallCompletion(callRecord, wsManager);

    // 🚀 IMMEDIATE: Update call record with only essential data
    const callEndTime = callRecord.callEndTime || new Date();
    
    // Calculate duration from callStartTime and callEndTime if available
    let calculatedDuration = callRecord.duration;
    if (callRecord.callStartTime && callEndTime) {
      const startTime = new Date(callRecord.callStartTime).getTime();
      const endTime = new Date(callEndTime).getTime();
      calculatedDuration = Math.round((endTime - startTime) / 1000); // Convert to seconds
    }

    // Update call record with immediate data only (using fast suggestions)
    const immediateUpdateData: any = {
      mood: moodAnalysis.mood,
      sentiment: moodAnalysis.sentiment,
      aiSuggestions: fastSuggestionsArray, // Use fast suggestions for immediate DB update
      outcome: determineCallOutcome(fastSuggestionsArray, moodAnalysis),
      callEndTime: callEndTime,
      duration: calculatedDuration,
      emotionAnalysis: {
        emotions: moodAnalysis.emotions,
        emotionScores: moodAnalysis.emotionScores,
        confidence: moodAnalysis.confidence
      }
    };

    await CallRecord.findByIdAndUpdate(callRecord._id, immediateUpdateData);
    console.log('✅ Call record updated with immediate data');

    // Send final conversation message with immediate data
    const finalMessage = {
      type: 'transcription_processed',
      conversationId: callRecord.clientId.toString(),
      suggestions: suggestionsArray,
      metadata: {
        reason: 'transcript_processed',
        used_context_ids: [],
        processingTime: Date.now(),
        transcriptLength: transcript.length,
        suggestionCount: suggestionsArray.length,
        timestamp: new Date().toISOString()
      },
      moodAnalysis: moodAnalysis,
      emotionGraph: {
        emotions: moodAnalysis.emotions,
        scores: moodAnalysis.emotionScores,
        primaryMood: moodAnalysis.mood,
        sentiment: moodAnalysis.sentiment
      },
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToConversation(callRecord.clientId.toString(), finalMessage);
    console.log(`✅ Final conversation message sent with immediate data: ${suggestionsArray.length} suggestions`);

  } catch (error) {
    console.error('❌ Error processing transcription for AI:', error);
  }
}

// Fast suggestion function for immediate responses
async function generateFastSuggestions(
  transcript: string,
  moodAnalysis: any
): Promise<any> {
  try {
    const { OpenAIClient } = await import('../services/openaiClient');
    const openaiClient = new OpenAIClient();

    if (!openaiClient.client) {
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    // FAST MODE: Minimal prompt, no heavy context for immediate response
    const fastPrompt = `Expert FoodHub Sales Agent. Customer: "${transcript.slice(-200)}"
Mood: ${moodAnalysis.mood}, Sentiment: ${moodAnalysis.sentiment}

Provide 2 immediate, actionable suggestions in JSON:
{
  "suggestions": [
    {
      "text": "Quick actionable suggestion based on customer mood",
      "type": "solution|question|offer",
      "confidence": 0.8,
      "deliver_as": "immediate_response",
      "offer_id": "fast_suggestion",
      "customer_mood": "${moodAnalysis.mood}"
    }
  ]
}`;

    // Check rate limit for fast suggestions
    const canMakeCall = await rateLimiter.canMakeCall('fast_suggestions', 200);
    if (!canMakeCall) {
      console.log('🚫 Rate limit exceeded for fast suggestions, using fallback');
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    const response = await openaiClient.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: "system", content: "Fast FoodHub Sales Assistant. Respond with JSON only." },
        { role: "user", content: fastPrompt }
      ],
      temperature: 0.3,
      max_tokens: 200 // Reduced for speed
    });

    const content = response.choices?.[0]?.message?.content;
    if (content) {
      // Simple JSON cleaning for fast mode
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error('Fast suggestion error:', error);
  }
  
  return generateMockSalesSuggestions(transcript, moodAnalysis);
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

    // Check cache first to avoid duplicate processing
    const cacheKey = `emotion_${Buffer.from(transcript.slice(-200)).toString('base64')}`;
    if (global.emotionCache && global.emotionCache.has(cacheKey)) {
      console.log('🎯 Using cached emotion analysis');
      return global.emotionCache.get(cacheKey);
    }

    // Check rate limit before making API call
    const estimatedTokens = 400; // Based on our max_tokens setting
    const canMakeCall = await rateLimiter.canMakeCall('emotion_analysis', estimatedTokens);
    
    if (!canMakeCall) {
      console.log('🚫 Rate limit exceeded for emotion analysis, using fallback');
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    const response = await openaiClient.client.chat.completions.create({
      model: 'gpt-4o-mini', // Force GPT-4o-mini for cost optimization
      messages: [
        {
          role: "system",
          content: "Expert FoodHub Sales Agent. Analyze customer emotions and provide actionable suggestions. Respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5, // Reduced for more consistent responses
      max_tokens: 400 // Reduced token usage by 50%
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response with improved error handling
    let parsedResponse;
    let cleanContent = '';
    try {
      // Remove markdown code blocks if present
      cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      
      // Extract JSON object from response
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      // Additional cleaning for common JSON issues
      cleanContent = cleanContent
        .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
        .replace(/,\s*]/g, ']')  // Remove trailing commas before closing brackets
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Quote unquoted keys
        .replace(/:(\s*)([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, ': "$2"$3');  // Quote unquoted string values
      
      parsedResponse = JSON.parse(cleanContent);
      
      // Cache the result for future use
      if (!global.emotionCache) {
        global.emotionCache = new Map();
      }
      global.emotionCache.set(cacheKey, parsedResponse);
      
      // Limit cache size to prevent memory issues
      if (global.emotionCache.size > 100) {
        const firstKey = global.emotionCache.keys().next().value;
        if (firstKey) {
          global.emotionCache.delete(firstKey);
        }
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response:', parseError);
      console.error('Raw response:', content);
      console.error('Cleaned content:', cleanContent);
      console.log('🔄 Falling back to mock suggestions due to JSON parsing error');
      
      // Try one more aggressive cleaning attempt
      try {
        let aggressiveClean = content.replace(/```json\n?|\n?```/g, '').trim();
        const jsonMatch = aggressiveClean.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aggressiveClean = jsonMatch[0];
        }
        
        // More aggressive cleaning
        aggressiveClean = aggressiveClean
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']')
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
          .replace(/:(\s*)([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, ': "$2"$3')
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, '$1"$2": "$3"$4')
          .replace(/:(\s*)(true|false|null)\s*([,}])/g, ': $1$2$3')
          .replace(/:(\s*)(\d+\.?\d*)\s*([,}])/g, ': $1$2$3')
          .replace(/:(\s*)([^",{\[\s][^",}\]\s]*?)(\s*[,}\]])/g, ': "$2"$3')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        
        if (aggressiveClean.trim().startsWith('{') && aggressiveClean.trim().endsWith('}')) {
          parsedResponse = JSON.parse(aggressiveClean);
          console.log('✅ Successfully parsed with aggressive cleaning');
          
          // Cache the result
          if (!global.emotionCache) {
            global.emotionCache = new Map();
          }
          global.emotionCache.set(cacheKey, parsedResponse);
          
          return parsedResponse;
        }
      } catch (finalError) {
        console.error('❌ Even aggressive cleaning failed:', finalError);
      }
      
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

// 🏁 END-OF-CALL ANALYSIS: Heavy processing for call completion
export async function performEndOfCallAnalysis(
  callRecord: any,
  finalTranscript: string,
  wsManager: WebSocketManager
): Promise<void> {
  try {
    console.log('🏁 ===== STARTING END-OF-CALL ANALYSIS =====');
    console.log(`📄 Call ID: ${callRecord._id}`);
    console.log(`📄 Phone: ${callRecord.phoneNumber}`);
    console.log(`📄 Final transcript length: ${finalTranscript.length} characters`);
    console.log(`📄 First 200 chars: "${finalTranscript.substring(0, 200)}..."`);
    
    const startTime = Date.now();
    
    // Perform comprehensive call analysis
    let callAnalysis = null;
    if (finalTranscript.length > 100) {
      try {
        console.log('🔍 Performing comprehensive call analysis...');
        callAnalysis = await CallAnalysisService.analyzeCall(finalTranscript, callRecord.duration || 0);
        console.log('✅ Call analysis completed:', callAnalysis.summary);
      } catch (error) {
        console.error('❌ Error in call analysis:', error);
      }
    }

    // Generate AI agent feedback
    let agentFeedback = null;
    if (finalTranscript.length > 100 && callAnalysis) {
      try {
        console.log('🤖 Generating AI agent feedback...');
        agentFeedback = await CallAnalysisService.generateAgentFeedback(finalTranscript, callAnalysis);
        console.log('✅ Agent feedback generated:', agentFeedback.overallFeedback);
      } catch (error) {
        console.error('❌ Error generating agent feedback:', error);
      }
    }

    // Generate AI call summary
    let callSummary = null;
    if (finalTranscript.length > 100 && callAnalysis && agentFeedback) {
      try {
        console.log('📝 Generating AI call summary...');
        callSummary = await CallAnalysisService.generateCallSummary(finalTranscript, callAnalysis, agentFeedback);
        console.log('✅ Call summary generated:', callSummary.overallAssessment);
      } catch (error) {
        console.error('❌ Error generating call summary:', error);
      }
    }

    // Generate enhanced analysis
    let enhancedAnalysis = null;
    if (finalTranscript.length > 50) {
      try {
        console.log('🔍 Generating enhanced analysis...');
        enhancedAnalysis = await CallAnalysisService.generateEnhancedAnalysis(finalTranscript);
        console.log('✅ Enhanced analysis generated:', enhancedAnalysis.moodAnalysis?.mood);
      } catch (error) {
        console.error('❌ Error generating enhanced analysis:', error);
      }
    }

    // Update database with all analysis results
    if (callAnalysis || agentFeedback || callSummary || enhancedAnalysis) {
      const endOfCallUpdateData: any = {};
      if (callAnalysis) endOfCallUpdateData.callAnalysis = callAnalysis;
      if (agentFeedback) endOfCallUpdateData.agentFeedback = agentFeedback;
      if (callSummary) endOfCallUpdateData.callSummary = callSummary;
      if (enhancedAnalysis) endOfCallUpdateData.enhancedAnalysis = enhancedAnalysis;
      
      // Mark call as completed
      endOfCallUpdateData.status = 'completed';
      endOfCallUpdateData.analysisCompletedAt = new Date();

      await CallRecord.findByIdAndUpdate(callRecord._id, endOfCallUpdateData);
      console.log('✅ Call record updated with end-of-call analysis data');

      // Send end-of-call analysis via WebSocket
      const endOfCallAnalysisMessage = {
        type: 'end_of_call_analysis_complete',
        callSid: callRecord.metadata?.callSid,
        callAnalysis: callAnalysis,
        agentFeedback: agentFeedback,
        callSummary: callSummary,
        enhancedAnalysis: enhancedAnalysis,
        metadata: {
          reason: 'end_of_call_analysis',
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime
        }
      };
      wsManager.broadcastToAll(endOfCallAnalysisMessage);
      console.log(`🏁 End-of-call analysis completed and sent in ${Date.now() - startTime}ms`);
    }
    
    console.log('🏁 ===== END-OF-CALL ANALYSIS COMPLETE =====');
  } catch (error) {
    console.error('❌ Error in end-of-call analysis:', error);
  }
}

// 🕒 AUTO-COMPLETE DETECTOR: Automatically trigger call analysis after inactivity
function scheduleAutoCallCompletion(callRecord: any, wsManager: WebSocketManager): void {
  // Cancel any existing timeout for this call
  const callId = callRecord._id.toString();
  
  if (global.autoCompleteTimeouts) {
    const existingTimeout = global.autoCompleteTimeouts.get(callId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
  } else {
    global.autoCompleteTimeouts = new Map();
  }
  
  // Schedule auto-completion after 30 seconds of inactivity
  const timeout = setTimeout(async () => {
    try {
      console.log(`🕒 Auto-completing call after inactivity: ${callId}`);
      
      // Check if call is still in progress
      const currentCall = await CallRecord.findById(callId);
      if (currentCall && currentCall.status === 'in_progress') {
        console.log(`🕒 Auto-completing call ${callId} - transcript length: ${currentCall.transcript?.length || 0}`);
        
        // Update call status to completed
        await CallRecord.findByIdAndUpdate(callId, {
          status: 'completed',
          callEndTime: new Date(),
          outcome: 'auto_completed'
        });
        
        // Trigger analysis if we have a meaningful transcript
        if (currentCall.transcript && currentCall.transcript.length > 50) {
          console.log(`🕒 Triggering auto-completion analysis for call ${callId}`);
          await performEndOfCallAnalysis(currentCall, currentCall.transcript, wsManager);
        } else {
          console.log(`🕒 Skipping analysis for call ${callId} - transcript too short or missing`);
        }
      }
      
      // Remove from timeout map
      if (global.autoCompleteTimeouts) {
        global.autoCompleteTimeouts.delete(callId);
      }
      
    } catch (error) {
      console.error(`❌ Error in auto-completion for call ${callId}:`, error);
    }
  }, 30000); // 30 seconds
  
  // Store the timeout
  global.autoCompleteTimeouts.set(callId, timeout);
  console.log(`🕒 Scheduled auto-completion for call ${callId} in 30 seconds`);
}