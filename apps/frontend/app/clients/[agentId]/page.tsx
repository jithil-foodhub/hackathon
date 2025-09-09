"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Calendar, MessageSquare, Brain, TrendingUp, Clock, CheckCircle, X, Eye, Lightbulb, Target, Zap, Users, ExternalLink } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

interface Client {
  _id: string;
  phoneNumber: string;
  status: string;
  notes: string;
  createdAt: string;
  lastCallDate?: string;
  mood?: string;
  sentiment?: number;
}

interface CallRecord {
  _id: string;
  clientId: string;
  phoneNumber: string;
  timestamp: string;
  duration: number;
  transcript: string;
  mood: string;
  sentiment: number;
  direction: string;
  aiSuggestions: any[];
  outcome: string;
  metadata: any;
}

interface AISuggestion {
  text: string;
  offer_id: string;
  type: string;
  confidence: number;
  deliver_as: 'say' | 'show' | 'email';
  reasoning?: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [client, setClient] = useState<Client | null>(null);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [currentCall, setCurrentCall] = useState<CallRecord | null>(null);
  const [liveSuggestions, setLiveSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<AISuggestion[]>([]);
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);

  useEffect(() => {
    fetchClientData();
    setupWebSocket();
  }, [agentId]);

  const fetchClientData = async () => {
    try {
      const [clientRes, callsRes] = await Promise.all([
        fetch(`/api/clients/${agentId}`),
        fetch(`/api/clients/${agentId}/calls`)
      ]);

      const clientData = await clientRes.json();
      const callsData = await callsRes.json();

      if (clientData.success) {
        setClient(clientData.data);
      }

      if (callsData.success) {
        setCallHistory(callsData.data);
      }
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('🔌 Connected to WebSocket for client details');
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📨 Client detail message received:', message);
        
        // Handle live transcript chunks for this specific client
        if (message.type === 'live_transcript_chunk') {
          console.log(`📝 Live transcript [${message.speaker || 'Unknown'}]: "${message.transcript}"`);
          
          // Set current call SID if not set, or if this is a new call
          if (!currentCallSid || currentCallSid !== message.callSid) {
            setCurrentCallSid(message.callSid);
            console.log(`🆔 Setting current call SID: ${message.callSid}`);
          }
          
          // Only process if this is the current call
          if (currentCallSid === null || message.callSid === currentCallSid) {
            setCurrentCall(prev => ({
              ...prev,
              callSid: message.callSid || 'unknown',
              speaker: message.speaker || 'Unknown',
              transcript: message.transcript,
              fullTranscript: message.fullTranscript || message.transcript,
              confidence: message.confidence || 0.5
            }));
          }
        }
        
        // Handle live analysis with AI suggestions for this client
        if (message.type === 'live_analysis') {
          console.log(`🤖 Live analysis for client ${agentId}: ${message.moodAnalysis?.mood || 'unknown'} mood`);
          console.log(`🤖 Call SID: ${message.callSid}, Current: ${currentCallSid}`);
          
          // Only process if this is the current call or if no current call is set
          if (currentCallSid === null || message.callSid === currentCallSid) {
            console.log(`✅ Processing suggestions for current call`);
            setLiveSuggestions(message.suggestions || []);
          } else {
            console.log(`⏭️ Skipping suggestions for different call`);
          }
        }
        
        // Handle final analysis
        if (message.type === 'final_analysis' && message.callRecord?.clientId === agentId) {
          console.log(`✅ Final analysis complete for client ${agentId}`);
          setCallHistory(prev => [message.callRecord, ...prev]);
          setLiveSuggestions([]);
        }
        
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      setIsConnected(false);
      console.log('🔌 WebSocket disconnected');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product_recommendation':
        return <TrendingUp className="w-5 h-5" />;
      case 'solution_consultation':
        return <Brain className="w-5 h-5" />;
      case 'business_growth':
        return <TrendingUp className="w-5 h-5" />;
      case 'pricing_inquiry':
        return <Clock className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'product_recommendation':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'solution_consultation':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'business_growth':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pricing_inquiry':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const openTranscriptModal = (transcript: string) => {
    setSelectedTranscript(transcript);
    setIsTranscriptModalOpen(true);
  };

  const closeTranscriptModal = () => {
    setSelectedTranscript(null);
    setIsTranscriptModalOpen(false);
  };

  const openSuggestionsModal = (suggestions: AISuggestion[]) => {
    setSelectedSuggestions(suggestions);
    setIsSuggestionsModalOpen(true);
  };

  const closeSuggestionsModal = () => {
    setSelectedSuggestions([]);
    setIsSuggestionsModalOpen(false);
  };

  if (isLoading) {
    return (
      <AppLayout currentScreen="clients">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading client details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout currentScreen="clients">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Client Not Found</h2>
            <p className="text-slate-600 mb-4">The requested client could not be found.</p>
            <button
              onClick={() => router.push('/clients')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Clients
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentScreen="clients">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/clients')}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Clients
              </button>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{client.phoneNumber}</h1>
                <p className="text-xl text-slate-600">Client Details & AI Suggestions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {isConnected ? 'Live' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Client Details */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Client Information</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Phone</span>
                <span className="font-medium text-slate-900">{client.phoneNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  client.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                  client.status === 'lead' ? 'bg-blue-100 text-blue-800' :
                  client.status === 'customer' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {client.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Created</span>
                <span className="font-medium text-slate-900">
                  {new Date(client.createdAt).toLocaleDateString()}
                </span>
              </div>
              {client.lastCallDate && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Last Call</span>
                  <span className="font-medium text-slate-900">
                    {new Date(client.lastCallDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {client.mood && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Mood</span>
                  <span className={`font-medium ${
                    client.mood === 'positive' ? 'text-green-600' :
                    client.mood === 'neutral' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {client.mood}
                  </span>
                </div>
              )}
            </div>
            {client.notes && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Notes</h4>
                <p className="text-sm text-slate-600">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Live AI Suggestions */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Live AI Suggestions</h3>
                  <p className="text-sm text-slate-500">Real-time recommendations during calls</p>
                </div>
              </div>
              {liveSuggestions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Live</span>
                </div>
              )}
            </div>
            
            {liveSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-medium text-slate-900 mb-2">No Live Suggestions</h4>
                <p className="text-slate-500 mb-4">AI suggestions will appear here during active calls</p>
                <div className="text-sm text-slate-400 bg-slate-50 rounded-lg p-3 inline-block">
                  💡 Make sure a call is active and transcription is working
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveSuggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.offer_id}-${index}`}
                    className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-4 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                          {suggestion.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs text-slate-500">
                          {(suggestion.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 mb-3 leading-relaxed line-clamp-3">
                      {suggestion.text}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 bg-white px-2 py-1 rounded border">
                        {suggestion.deliver_as}
                      </span>
                      <span className="text-slate-400 font-mono">
                        {suggestion.offer_id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Call History */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Call History</h3>
                <p className="text-sm text-slate-500">{callHistory.length} calls recorded</p>
              </div>
            </div>
          </div>

          {callHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-medium text-slate-900 mb-2">No Call History</h4>
              <p className="text-slate-500">Call records will appear here after conversations</p>
            </div>
          ) : (
            <div className="space-y-6">
              {callHistory.map((call) => (
                <div key={call._id} className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200 overflow-hidden">
                  {/* Call Header */}
                  <div className="p-5 border-b border-slate-200 bg-white/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            call.direction === 'inbound' ? 'bg-green-400' : 'bg-blue-400'
                          }`}></div>
                          <span className="text-sm font-semibold text-slate-700 capitalize">
                            {call.direction} Call
                          </span>
                        </div>
                        <div className="text-sm text-slate-600">
                          {new Date(call.timestamp).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-sm text-slate-600">
                          {new Date(call.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="text-sm text-slate-600">
                          {call.duration || 0}s
                        </div>
                      </div>
                      
                      {call.moodAnalysis && (
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                              call.moodAnalysis.mood === 'positive' ? 'bg-green-100 text-green-700' :
                              call.moodAnalysis.mood === 'negative' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                call.moodAnalysis.mood === 'positive' ? 'bg-green-500' :
                                call.moodAnalysis.mood === 'negative' ? 'bg-red-500' :
                                'bg-yellow-500'
                              }`}></div>
                              {call.moodAnalysis.mood}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Sentiment: {Math.round((call.moodAnalysis.sentiment || 0) * 100)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Call Content */}
                  <div className="p-5 space-y-4">
                    {/* Transcript Section */}
                    {call.transcript && (
                      <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4" />
                            <span>Conversation</span>
                          </h5>
                          <button
                            onClick={() => openTranscriptModal(call.transcript)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Full</span>
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {call.transcript.length > 150
                            ? `${call.transcript.substring(0, 150)}...`
                            : call.transcript
                          }
                        </p>
                      </div>
                    )}
                    
                    {/* AI Suggestions Section */}
                    {call.aiSuggestions && call.aiSuggestions.length > 0 && (
                      <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                            <Lightbulb className="w-4 h-4" />
                            <span>AI Suggestions ({call.aiSuggestions.length})</span>
                          </h5>
                          <button
                            onClick={() => openSuggestionsModal(call.aiSuggestions)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                          >
                            <Lightbulb className="w-4 h-4" />
                            <span>View All</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {call.aiSuggestions.slice(0, 2).map((suggestion, index) => (
                            <div key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-100 hover:shadow-sm transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1 bg-purple-100 rounded">
                                    {getSuggestionIcon(suggestion.type)}
                                  </div>
                                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                                    {suggestion.type.replace('_', ' ').toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                  <span className="text-xs text-slate-500">
                                    {(suggestion.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-slate-800 mb-2 line-clamp-2 leading-relaxed">
                                {suggestion.text}
                              </p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                  {suggestion.deliver_as}
                                </span>
                                <span className="text-slate-400 font-mono">
                                  {suggestion.offer_id}
                                </span>
                              </div>
                            </div>
                          ))}
                          {call.aiSuggestions.length > 2 && (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-3 flex items-center justify-center">
                              <span className="text-sm text-slate-500 font-medium">
                                +{call.aiSuggestions.length - 2} more suggestions
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Transcript Modal */}
      {isTranscriptModalOpen && selectedTranscript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-900">Full Call Transcript</h3>
              <button
                onClick={closeTranscriptModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {(() => {
                  // Parse the transcript into speaker segments
                  const segments = selectedTranscript.match(/\[(Customer|Agent)\]:\s*([^[]*)/g) || [];
                  
                  return segments.map((segment, index) => {
                    const match = segment.match(/\[(Customer|Agent)\]:\s*(.*)/);
                    if (!match) return null;
                    
                    const speaker = match[1];
                    const text = match[2].trim();
                    const isCustomer = speaker === 'Customer';
                    
                    if (!text) return null;
                    
                    return (
                      <div key={index} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[70%] p-4 rounded-xl ${
                          isCustomer 
                            ? 'bg-blue-50 border-l-4 border-blue-400' 
                            : 'bg-green-50 border-l-4 border-green-400'
                        }`}>
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`text-sm font-semibold ${
                              isCustomer ? 'text-blue-700' : 'text-green-700'
                            }`}>
                              {speaker}
                            </span>
                            <span className="text-xs text-slate-500">
                              {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed">{text}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <div className="flex justify-end">
                <button
                  onClick={closeTranscriptModal}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Suggestions Modal */}
      {isSuggestionsModalOpen && selectedSuggestions.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">AI Suggestions</h3>
                  <p className="text-sm text-slate-500">{selectedSuggestions.length} suggestions generated</p>
                </div>
              </div>
              <button
                onClick={closeSuggestionsModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100 p-6 hover:shadow-lg transition-all duration-200">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {getSuggestionIcon(suggestion.type)}
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                            {suggestion.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-slate-500">
                              {(suggestion.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">
                          {suggestion.deliver_as}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <p className="text-slate-800 leading-relaxed mb-3">{suggestion.text}</p>
                      {suggestion.reasoning && (
                        <div className="bg-white/60 p-3 rounded-lg border border-purple-100">
                          <div className="flex items-start space-x-2">
                            <Brain className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-purple-700 mb-1">AI Reasoning:</p>
                              <p className="text-xs text-slate-600 leading-relaxed">{suggestion.reasoning}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-purple-100">
                      <span className="text-xs text-slate-400 font-mono">
                        {suggestion.offer_id}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button className="text-xs text-purple-600 hover:text-purple-700 flex items-center space-x-1">
                          <ExternalLink className="w-3 h-3" />
                          <span>Use Suggestion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  Generated by AI • {selectedSuggestions.length} suggestions
                </div>
                <button
                  onClick={closeSuggestionsModal}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
