import { Request, Response } from 'express';
import { WebSocketManager } from '../services/websocket';
import { LatencyProfiler } from '../services/latencyProfiler';
import { FoodHubService } from '../services/foodhubService';
import { OpenAIClient } from '../services/openaiClient';
import { Client } from '../models/Client';
import { CallRecord } from '../models/CallRecord';
import { mongoDBService } from '../services/mongodb';
import { PROMPTS, buildPrompt } from '../prompts';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const foodhubService = new FoodHubService();
const openaiClient = new OpenAIClient();

interface TwilioCallData {
  CallSid: string;
  From: string;
  To: string;
  CallStatus: string;
  Direction: string;
  Duration?: string;
  RecordingUrl?: string;
  TranscriptionText?: string;
  TranscriptionSid?: string;
  CallerName?: string;
  CallerCity?: string;
  CallerState?: string;
  CallerCountry?: string;
}

interface MoodAnalysis {
  mood: 'positive' | 'neutral' | 'negative';
  sentiment: number; // -1 to 1
  confidence: number;
  keywords: string[];
  emotions: string[];
}

export function twilioCallWebhook(
  wsManager: WebSocketManager,
  latencyProfiler: LatencyProfiler
) {
  return async (req: Request, res: Response) => {
    const endTiming = latencyProfiler.startTiming("twilio_call_webhook");

    try {
      const callData: TwilioCallData = req.body;
      
      console.log(`📞 Twilio Call Webhook: ${callData.CallSid}`);
      console.log(`📱 From: ${callData.From} | To: ${callData.To}`);
      console.log(`📊 Status: ${callData.CallStatus} | Direction: ${callData.Direction}`);
      
      // Broadcast call status to connected clients
      const callStatusMessage = {
        type: 'call_status_update',
        callSid: callData.CallSid,
        from: callData.From,
        to: callData.To,
        status: callData.CallStatus,
        direction: callData.Direction,
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to all connected clients
      wsManager.broadcastToAll(callStatusMessage);

      // Handle different call statuses
      switch (callData.CallStatus) {
        case 'ringing':
        case 'in-progress':
          return handleCallStart(callData, res);
        
        case 'completed':
          return handleCallCompleted(callData, res, wsManager, endTiming);
        
        case 'busy':
        case 'no-answer':
        case 'failed':
          return handleCallEnded(callData, res, wsManager, endTiming);
        
        default:
          console.log(`ℹ️ Unhandled call status: ${callData.CallStatus}`);
          return res.status(200).send('OK');
      }

    } catch (error) {
      console.error('❌ Twilio webhook error:', error);
      endTiming();
      res.status(500).send('Internal Server Error');
    }
  };
}

async function handleCallStart(callData: TwilioCallData, res: Response) {
  console.log(`📞 Call started: ${callData.CallSid}`);
  
  try {
    console.log('🔍 Finding or creating client...');
    // Find or create client
    const client = await findOrCreateClient(callData.From, callData.To);
    console.log(`✅ Client found/created: ${client._id}`);
    
    console.log('🔍 Creating call record...');
    // Create call record for this call
    const callRecord = new CallRecord({
      clientId: client._id,
      phoneNumber: callData.From,
      timestamp: new Date(),
      duration: 0,
      transcript: '',
      mood: 'neutral',
      sentiment: 0.5,
      direction: callData.Direction,
      status: 'in_progress',
      aiSuggestions: [],
      metadata: {
        callSid: callData.CallSid,
        callStatus: callData.CallStatus,
        toNumber: callData.To
      }
    });

    await callRecord.save();
    console.log(`✅ Call record created: ${callData.CallSid} for client ${client.phoneNumber}`);

    // Return TwiML with transcription callback
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Transcription statusCallbackUrl="https://hallie-postasthmatic-sharan.ngrok-free.app/webhook/twilio/transcription" track="both_tracks" />
  </Start>
  <Dial>+918807756733</Dial>
</Response>`;

    res.type('text/xml');
    res.send(twiml);
  } catch (error) {
    console.error('❌ Error in handleCallStart:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).send('Internal Server Error');
  }
}

async function handleCallCompleted(
  callData: TwilioCallData, 
  res: Response, 
  wsManager: WebSocketManager,
  endTiming: () => number
) {
  console.log(`✅ Call completed: ${callData.CallSid}`);
  
  try {
    // Find or create client based on phone number
    const client = await findOrCreateClient(callData.From, callData.To);
    
    // Get call duration
    const duration = callData.Duration ? parseInt(callData.Duration) : 0;
    
    // Create call record
    const callRecord = new CallRecord({
      clientId: client._id,
      phoneNumber: callData.From,
      timestamp: new Date(),
      duration: duration,
      transcript: callData.TranscriptionText || '',
      mood: 'neutral', // Will be updated when transcript is processed
      sentiment: 0,
      direction: callData.Direction === 'inbound' ? 'inbound' : 'outbound',
      outcome: 'successful',
      aiSuggestions: [],
      metadata: {
        callSid: callData.CallSid,
        callerName: callData.CallerName,
        callerCity: callData.CallerCity,
        callerState: callData.CallerState,
        callerCountry: callData.CallerCountry,
        recordingUrl: callData.RecordingUrl
      }
    });

    await callRecord.save();

    // Update client with call info
    await Client.findByIdAndUpdate(client._id, {
      lastCallDate: callRecord.timestamp,
      totalCalls: client.totalCalls + 1,
      lastInteraction: callData.TranscriptionText?.substring(0, 100) + '...' || 'Call completed',
      updatedAt: new Date()
    });

    // Process transcript for AI suggestions if available
    if (callData.TranscriptionText) {
      await processCallTranscript(callRecord, wsManager);
    }

    console.log(`✅ Call record created and client updated: ${client.phoneNumber}`);
    
    res.status(200).send('OK');
    endTiming();

  } catch (error) {
    console.error('❌ Error processing completed call:', error);
    res.status(500).send('Internal Server Error');
    endTiming();
  }
}

async function handleCallEnded(
  callData: TwilioCallData, 
  res: Response, 
  wsManager: WebSocketManager,
  endTiming: () => number
) {
  console.log(`❌ Call ended: ${callData.CallSid} - ${callData.CallStatus}`);
  
  try {
    // Find or create client
    const client = await findOrCreateClient(callData.From, callData.To);
    
    // Create call record for failed/busy calls
    const callRecord = new CallRecord({
      clientId: client._id,
      phoneNumber: callData.From,
      timestamp: new Date(),
      duration: callData.Duration ? parseInt(callData.Duration) : 0,
      transcript: 'Call ended without completion',
      mood: 'neutral',
      sentiment: 0,
      direction: callData.Direction === 'inbound' ? 'inbound' : 'outbound',
      outcome: callData.CallStatus === 'busy' ? 'busy' : 
               callData.CallStatus === 'no-answer' ? 'no_answer' : 'declined',
      aiSuggestions: [],
      metadata: {
        callSid: callData.CallSid,
        callStatus: callData.CallStatus
      }
    });

    await callRecord.save();

    // Update client
    await Client.findByIdAndUpdate(client._id, {
      lastCallDate: callRecord.timestamp,
      totalCalls: client.totalCalls + 1,
      lastInteraction: `Call ${callData.CallStatus}`,
      updatedAt: new Date()
    });

    console.log(`✅ Call end record created: ${client.phoneNumber}`);
    
    res.status(200).send('OK');
    endTiming();

  } catch (error) {
    console.error('❌ Error processing ended call:', error);
    res.status(500).send('Internal Server Error');
    endTiming();
  }
}

async function findOrCreateClient(fromNumber: string, toNumber: string) {
  // Clean phone number format
  const cleanFromNumber = fromNumber.replace(/\D/g, '');
  
  // Try to find existing client by phone number
  let client = await Client.findOne({ 
    phoneNumber: { $regex: cleanFromNumber, $options: 'i' } 
  });

  if (!client) {
    // Create new client
    client = new Client({
      phoneNumber: fromNumber,
      status: 'prospect',
      totalCalls: 0,
      notes: `Auto-created from Twilio call to ${toNumber}`
    });
    
    await client.save();
    console.log(`👤 New client created: ${fromNumber}`);
  }

  return client;
}

async function processCallTranscript(callRecord: CallRecord, wsManager: WebSocketManager) {
  try {
    console.log(`🤖 Processing transcript for call: ${callRecord._id}`);
    console.log(`📄 Transcript: "${callRecord.transcript}"`);
    
    // Analyze mood and sentiment
    const moodAnalysis = await analyzeCallMood(callRecord.transcript);
    console.log(`😊 Mood Analysis: ${moodAnalysis.mood} (${moodAnalysis.sentiment})`);
    console.log(`🎯 Emotions: ${moodAnalysis.emotions.join(', ')}`);
    console.log(`🔑 Keywords: ${moodAnalysis.keywords.join(', ')}`);
    
    // Get client history
    const clientHistory = await CallRecord.find({ clientId: callRecord.clientId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    // Generate AI sales suggestions
    const salesSuggestions = await generateSalesSuggestions(
      callRecord.transcript,
      moodAnalysis,
      clientHistory,
      callRecord.phoneNumber
    );

    console.log(`💡 Generated ${salesSuggestions.suggestions.length} AI suggestions:`);
    salesSuggestions.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. [${suggestion.type}] ${suggestion.text}`);
      console.log(`      Confidence: ${suggestion.confidence} | Deliver as: ${suggestion.deliver_as}`);
    });

    // Update call record with analysis
    await CallRecord.findByIdAndUpdate(callRecord._id, {
      mood: moodAnalysis.mood,
      sentiment: moodAnalysis.sentiment,
      aiSuggestions: salesSuggestions.suggestions,
      outcome: determineCallOutcome(salesSuggestions.suggestions, moodAnalysis)
    });

    // Broadcast to connected agents
    const wsMessage = {
      type: 'call_transcript_processed',
      conversationId: callRecord.clientId.toString(),
      callRecord: {
        id: callRecord._id,
        clientId: callRecord.clientId,
        phoneNumber: callRecord.phoneNumber,
        timestamp: callRecord.timestamp,
        duration: callRecord.duration,
        transcript: callRecord.transcript,
        mood: moodAnalysis.mood,
        sentiment: moodAnalysis.sentiment,
        direction: callRecord.direction,
        aiSuggestions: salesSuggestions.suggestions,
        outcome: determineCallOutcome(salesSuggestions.suggestions, moodAnalysis),
        metadata: callRecord.metadata
      },
      moodAnalysis,
      clientHistory: clientHistory.slice(-3),
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToConversation(callRecord.clientId.toString(), wsMessage);

    console.log(`✅ Transcript processed and broadcasted: ${salesSuggestions.suggestions.length} suggestions`);

  } catch (error) {
    console.error('❌ Error processing transcript:', error);
  }
}

export async function analyzeCallMood(transcript: string): Promise<MoodAnalysis> {
  try {
    console.log('😊 Starting mood analysis for transcript:', transcript);
    
    if (!transcript || transcript.trim().length === 0) {
      console.log('⚠️ Empty transcript, returning neutral mood');
      return { mood: 'neutral', sentiment: 0, confidence: 0.5, emotions: ['neutral'] };
    }
    
    if (!openaiClient.client) {
      console.log('⚠️ OpenAI client not available, using keyword analysis');
      return analyzeMoodWithKeywords(transcript);
    }

    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages: [
        {
          role: "system",
          content: PROMPTS.SYSTEM.MOOD_ANALYSIS
        },
        {
          role: "user",
          content: buildPrompt.moodAnalysis(transcript)
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices?.[0]?.message?.content;
    if (content) {
      try {
        // Handle different JSON response formats for mood analysis
        let jsonContent = content.trim();
        
        // Remove markdown code blocks if present
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          console.log('🔧 Removed markdown code blocks from mood analysis');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          console.log('🔧 Removed generic code blocks from mood analysis');
        }
        
        // Try to extract JSON from the content if it's wrapped in other text
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
          console.log('🔧 Extracted JSON from wrapped mood analysis content');
        }
        
        console.log('🔧 Cleaned mood analysis JSON content:', jsonContent);
        const moodData = JSON.parse(jsonContent);
        console.log('✅ Mood analysis result:', moodData);
        return {
          mood: moodData.mood || 'neutral',
          sentiment: moodData.sentiment || 0,
          confidence: moodData.confidence || 0.5,
          emotions: moodData.emotions || ['neutral']
        };
      } catch (parseError) {
        console.error('❌ Failed to parse mood analysis JSON:', parseError);
        console.log('📄 Raw mood content:', content);
        console.log('🔧 Attempted to clean mood content but still failed');
        return analyzeMoodWithKeywords(transcript);
      }
    } else {
      console.log('⚠️ No content in mood analysis response');
      return analyzeMoodWithKeywords(transcript);
    }
  } catch (error) {
    console.error("❌ Error in mood analysis:", error);
    console.error("❌ Error details:", error.message);
    return analyzeMoodWithKeywords(transcript);
  }
}

function analyzeMoodWithKeywords(transcript: string): MoodAnalysis {
  console.log('🔍 Analyzing mood with keywords for:', transcript);
  const text = transcript.toLowerCase();
  
  const positiveKeywords = ['great', 'excellent', 'good', 'perfect', 'love', 'amazing', 'wonderful', 'fantastic', 'yes', 'interested', 'excited'];
  const negativeKeywords = ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'frustrated', 'angry', 'upset', 'no', 'not interested', 'problem'];
  
  const positiveCount = positiveKeywords.filter(keyword => text.includes(keyword)).length;
  const negativeCount = negativeKeywords.filter(keyword => text.includes(keyword)).length;
  
  let mood: 'positive' | 'neutral' | 'negative';
  let sentiment: number;
  
  if (positiveCount > negativeCount) {
    mood = 'positive';
    sentiment = Math.min(0.8, 0.3 + (positiveCount * 0.1));
  } else if (negativeCount > positiveCount) {
    mood = 'negative';
    sentiment = Math.max(-0.8, -0.3 - (negativeCount * 0.1));
  } else {
    mood = 'neutral';
    sentiment = 0;
  }
  
  const result = {
    mood,
    sentiment,
    confidence: 0.7,
    keywords: [...positiveKeywords, ...negativeKeywords].filter(keyword => text.includes(keyword)),
    emotions: mood === 'positive' ? ['satisfied', 'interested'] : 
             mood === 'negative' ? ['frustrated', 'concerned'] : 
             ['neutral', 'curious']
  };
  
  console.log('✅ Keyword mood analysis result:', result);
  return result;
}

export async function generateSalesSuggestions(
  transcript: string,
  moodAnalysis: MoodAnalysis,
  clientHistory: any[],
  phoneNumber: string
): Promise<any> {
  try {
    console.log('🤖 Starting generateSalesSuggestions...');
    console.log('📝 Transcript:', transcript);
    console.log('😊 Mood Analysis:', moodAnalysis);
    console.log('📞 Phone:', phoneNumber);
    
    // Validate inputs
    if (!transcript || transcript.trim().length === 0) {
      console.log('⚠️ Empty transcript, returning mock suggestions');
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }
    
    if (!moodAnalysis) {
      console.log('⚠️ No mood analysis provided, using default');
      moodAnalysis = { mood: 'neutral', sentiment: 0, confidence: 0.5 };
    }
    
    if (!clientHistory) {
      console.log('⚠️ No client history provided, using empty array');
      clientHistory = [];
    }

    if (!openaiClient.client) {
      console.log('⚠️ OpenAI client not available, returning mock suggestions');
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }

    // Get relevant FoodHub context using LangChain RAG
    const foodHubContext = foodhubService.getFoodHubContext();
    const relevantContext = await foodhubService.extractRelevantContext(transcript);
    const productInfo = foodhubService.getProductInfo(transcript);

    const prompt = buildPrompt.salesSuggestions(transcript, moodAnalysis, clientHistory, relevantContext, productInfo);

    console.log('🚀 Sending request to OpenAI...');
    const response = await openaiClient.client.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages: [
        {
          role: "system",
          content: PROMPTS.SYSTEM.SALES_AGENT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    console.log('✅ OpenAI response received');
    const content = response.choices?.[0]?.message?.content;
    if (content) {
      console.log('📄 OpenAI content:', content);
      try {
        // Handle different JSON response formats
        let jsonContent = content.trim();
        
        // Remove markdown code blocks if present
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          console.log('🔧 Removed markdown code blocks');
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
          console.log('🔧 Removed generic code blocks');
        }
        
        // Try to extract JSON from the content if it's wrapped in other text
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
          console.log('🔧 Extracted JSON from wrapped content');
        }
        
        console.log('🔧 Cleaned JSON content:', jsonContent);
        const parsed = JSON.parse(jsonContent);
        console.log('✅ Successfully parsed OpenAI response');
        return parsed;
      } catch (parseError) {
        console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
        console.log('📄 Raw content:', content);
        console.log('🔧 Attempted to clean content but still failed');
        return generateMockSalesSuggestions(transcript, moodAnalysis);
      }
    } else {
      console.log('⚠️ No content in OpenAI response');
      return generateMockSalesSuggestions(transcript, moodAnalysis);
    }
  } catch (error) {
    console.error("❌ Error generating sales suggestions:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    return generateMockSalesSuggestions(transcript, moodAnalysis);
  }
}

function generateMockSalesSuggestions(transcript: string, moodAnalysis: MoodAnalysis): any {
  const suggestions = [];
  
  if (moodAnalysis.mood === 'positive') {
    suggestions.push({
      text: `Great to hear your enthusiasm! Based on your interest, I'd recommend our Fusion EPOS system which offers everything you need for restaurant management. Would you like to schedule a demo to see it in action?`,
      offer_id: 'fusion-epos-demo',
      type: 'product_recommendation',
      confidence: 0.9,
      deliver_as: 'say',
      reasoning: 'Customer shows positive mood and interest'
    });
  } else if (moodAnalysis.mood === 'negative') {
    suggestions.push({
      text: `I understand your concerns. Let me address them directly and show you how our solutions can solve the specific challenges you're facing. What's the main issue you'd like to resolve?`,
      offer_id: 'empathy-response',
      type: 'empathy_response',
      confidence: 0.8,
      deliver_as: 'say',
      reasoning: 'Customer shows negative mood, needs empathy and problem-solving approach'
    });
  } else {
    suggestions.push({
      text: `I'd be happy to help you explore our restaurant technology solutions. Let me understand your specific needs better - what type of restaurant are you running?`,
      offer_id: 'solution_consultation',
      type: 'solution_consultation',
      confidence: 0.7,
      deliver_as: 'say',
      reasoning: 'Neutral mood, needs more information gathering'
    });
  }

  return {
    suggestions,
    metadata: {
      reason: `Generated suggestions based on ${moodAnalysis.mood} mood and customer needs`,
      used_context_ids: ['mood-analysis', 'transcript-analysis'],
      mood_considerations: `Customer mood (${moodAnalysis.mood}) influenced the approach`
    }
  };
}

export function determineCallOutcome(suggestions: any[], moodAnalysis: MoodAnalysis): string {
  if (moodAnalysis.mood === 'positive' && suggestions.some(s => s.type === 'product_recommendation')) {
    return 'successful';
  } else if (moodAnalysis.mood === 'negative') {
    return 'follow_up';
  } else if (suggestions.some(s => s.type === 'empathy_response')) {
    return 'follow_up';
  } else {
    return 'follow_up';
  }
}
