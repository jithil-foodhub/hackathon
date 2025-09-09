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

async function processTranscriptionForAI(
  callRecord: CallRecord, 
  transcript: string, 
  wsManager: WebSocketManager
) {
  try {
    console.log(`\n🤖 ===== STARTING AI PROCESSING =====`);
    console.log(`🤖 Processing transcription for AI suggestions: ${JSON.stringify(callRecord)}`);
    console.log(`📄 Current transcript: "${transcript}"`);
    console.log(`📊 Transcript length: ${transcript.length} characters`);
    
    // Import the AI processing functions
    const { analyzeCallMood, generateSalesSuggestions, determineCallOutcome } = await import('./twilioWebhook');
    
    // Simple mood analysis to reduce tokens
    const moodAnalysis = {
      mood: transcript.toLowerCase().includes('good') || transcript.toLowerCase().includes('great') || transcript.toLowerCase().includes('excellent') ? 'positive' : 
            transcript.toLowerCase().includes('bad') || transcript.toLowerCase().includes('terrible') || transcript.toLowerCase().includes('awful') ? 'negative' : 'neutral',
      sentiment: transcript.toLowerCase().includes('good') || transcript.toLowerCase().includes('great') ? 0.8 : 
                transcript.toLowerCase().includes('bad') || transcript.toLowerCase().includes('terrible') ? 0.2 : 0.5
    };
    console.log(`😊 Mood Analysis: ${moodAnalysis.mood} (${moodAnalysis.sentiment})`);
    
    // Get only recent client history to reduce context
    const clientHistory = await CallRecord.find({ clientId: callRecord.clientId })
      .sort({ timestamp: -1 })
      .limit(2)
      .lean();

    // Generate AI sales suggestions with reduced context
    const salesSuggestions = await generateSalesSuggestions(
      transcript.slice(-200), // Only use last 200 characters
      moodAnalysis,
      clientHistory,
      callRecord.phoneNumber
    );

    console.log(`\n🤖 ===== AI RESPONSE ANALYSIS =====`);
    console.log(`📞 Call ID: ${callRecord._id}`);
    console.log(`📱 Phone: ${callRecord.phoneNumber}`);
    console.log(`📄 Transcript: "${transcript}"`);
    console.log(`😊 Mood: ${moodAnalysis.mood} (${moodAnalysis.sentiment})`);
    console.log(`🔍 Raw AI Response:`, JSON.stringify(salesSuggestions, null, 2));
    
    // Fix the parsing issue - ensure suggestions is an array
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
    
    console.log(`💡 Generated ${suggestionsArray.length} AI suggestions:`);
    console.log(`\n📋 SUGGESTIONS DETAILS:`);
    suggestionsArray.forEach((suggestion, index) => {
      console.log(`\n   ${index + 1}. [${suggestion.type.toUpperCase()}]`);
      console.log(`      💬 Text: "${suggestion.text}"`);
      console.log(`      🎯 Confidence: ${(suggestion.confidence * 100).toFixed(1)}%`);
      console.log(`      📤 Deliver as: ${suggestion.deliver_as}`);
      console.log(`      🆔 Offer ID: ${suggestion.offer_id}`);
      if (suggestion.reasoning) {
        console.log(`      🧠 Reasoning: ${suggestion.reasoning}`);
      }
    });
    console.log(`\n🚀 Broadcasting to ${wsManager.getConnectionCount()} connected clients...`);
    console.log(`==========================================\n`);

    // Perform comprehensive call analysis if transcript is substantial
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

    // Update call record with AI analysis and call analysis
    const updateData: any = {
      mood: moodAnalysis.mood,
      sentiment: moodAnalysis.sentiment,
      aiSuggestions: suggestionsArray,
      outcome: determineCallOutcome(suggestionsArray, moodAnalysis)
    };

    if (callAnalysis) {
      updateData.callAnalysis = callAnalysis;
    }

    await CallRecord.findByIdAndUpdate(callRecord._id, updateData);

    // Broadcast live analysis to all connected clients (including AI Suggestions page)
    const liveAnalysisMessage = {
      type: 'live_analysis',
      callSid: callRecord.metadata?.callSid,
      transcript: transcript,
      moodAnalysis: moodAnalysis,
      suggestions: suggestionsArray,
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToAll(liveAnalysisMessage);

    // Also broadcast to specific conversation
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
        direction: callRecord.direction,
        aiSuggestions: suggestionsArray,
        outcome: determineCallOutcome(suggestionsArray, moodAnalysis),
        metadata: callRecord.metadata
      },
      moodAnalysis,
      clientHistory: clientHistory.slice(-3),
      timestamp: new Date().toISOString()
    };

    wsManager.broadcastToConversation(callRecord.clientId.toString(), wsMessage);

    console.log(`✅ AI suggestions broadcasted to all connected clients: ${suggestionsArray.length} suggestions`);

  } catch (error) {
    console.error('❌ Error processing transcription for AI:', error);
  }
}
