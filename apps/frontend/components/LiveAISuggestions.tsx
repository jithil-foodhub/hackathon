'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Target, RefreshCw, Zap, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import { WebSocketClient, WebSocketMessage } from '../hooks/useWebSocket';

interface AISuggestion {
  text: string;
  offer_id: string;
  type: string;
  confidence: number;
  deliver_as: 'say' | 'internal_note' | 'immediate_response';
  reasoning?: string;
}

interface LiveAISuggestionsProps {
  agentId?: string;
  callSid?: string;
  className?: string;
  showHeader?: boolean;
  maxSuggestions?: number;
}

export const LiveAISuggestions: React.FC<LiveAISuggestionsProps> = ({
  agentId,
  callSid,
  className = '',
  showHeader = true,
  maxSuggestions = 3
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const wsRef = useRef<WebSocketClient | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    console.log('🚀 Initializing Live AI Suggestions WebSocket...');
    const wsClient = new WebSocketClient();
    wsRef.current = wsClient;

    wsClient.onConnect = () => {
      console.log('🔌 Live AI Suggestions WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    wsClient.onDisconnect = () => {
      console.log('🔌 Live AI Suggestions WebSocket disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };

    wsClient.onError = (error) => {
      console.error('❌ Live AI Suggestions WebSocket error:', error);
      setConnectionStatus('error');
    };

    wsClient.onMessage = (message: WebSocketMessage) => {
      console.log('📨 Live AI Suggestions received message:', message);
      
      // Handle different message types
      if (message.type === 'suggestions' || message.suggestions) {
        const newSuggestions = message.suggestions || [];
        setSuggestions(prev => {
          // Replace with new suggestions (don't append)
          return newSuggestions.slice(0, maxSuggestions);
        });
        setLastUpdate(new Date().toISOString());
      } else if (message.type === 'instant_suggestions') {
        // Handle instant suggestions
        const instantSuggestions = message.suggestions || [];
        setSuggestions(prev => {
          // Replace with instant suggestions for immediate feedback
          return instantSuggestions.slice(0, maxSuggestions);
        });
        setLastUpdate(new Date().toISOString());
        console.log('⚡ Instant suggestions received:', instantSuggestions.length);
      } else if (message.type === 'call_started') {
        setCurrentCall(message.callData);
        setIsLiveStreaming(true);
        console.log('📞 Call started:', message.callData);
      } else if (message.type === 'call_ended') {
        setCurrentCall(null);
        setIsLiveStreaming(false);
        console.log('📞 Call ended');
      } else if (message.type === 'transcript_chunk') {
        // Handle live transcript updates
        console.log('📝 Transcript chunk received:', message.transcript);
      }
    };

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up Live AI Suggestions WebSocket');
      wsRef.current?.disconnect();
    };
  }, [agentId, callSid, maxSuggestions]);

  const handleSuggestionAction = (suggestion: AISuggestion, action: 'use' | 'dismiss') => {
    console.log(`🎯 Suggestion ${action}:`, suggestion);
    
    if (action === 'use') {
      // Handle suggestion usage
      console.log('✅ Using suggestion:', suggestion.text);
      // You can add logic here to send the suggestion to the agent or call system
    } else {
      // Remove dismissed suggestion
      setSuggestions(prev => prev.filter(s => s.offer_id !== suggestion.offer_id));
    }
  };

  const clearAllSuggestions = () => {
    setSuggestions([]);
    setLastUpdate('');
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'disconnected': return 'text-red-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'agent_response': return 'RESPOND';
      case 'customer_question': return 'ANSWER';
      case 'competitor_mention': return 'COMPETE';
      case 'solution_consultation': return 'SOLVE';
      case 'product_recommendation': return 'OFFER';
      case 'pricing_inquiry': return 'PRICE';
      default: return 'SUGGEST';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-slate-200 ${className}`}>
      {showHeader && (
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Live AI Suggestions
                </h3>
                <p className="text-sm text-slate-500">
                  Real-time recommendations during calls
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                  'bg-red-400'
                }`}></div>
                <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                  {getConnectionStatusText()}
                </span>
              </div>

              {/* Action Buttons */}
              {suggestions.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={clearAllSuggestions}
                    className="flex items-center px-3 py-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Clear all suggestions"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        {suggestions.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-medium text-slate-900 mb-1">
              No suggestions yet
            </h4>
            <p className="text-xs text-slate-500">
              {isConnected 
                ? 'AI suggestions will appear here during calls'
                : 'Connecting...'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Live Status */}
            {isLiveStreaming && (
              <div className="flex items-center justify-center space-x-2 py-1 px-3 bg-green-50 rounded-lg border border-green-200 mb-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700">
                  LIVE CALL
                </span>
              </div>
            )}

            {/* Compact Suggestions List */}
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.offer_id}-${index}`}
                  className="group p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 hover:border-purple-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                        {getSuggestionTypeLabel(suggestion.type)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleSuggestionAction(suggestion, 'use')}
                        className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                        title="Use this suggestion"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleSuggestionAction(suggestion, 'dismiss')}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Dismiss suggestion"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 leading-tight mb-2">
                    {suggestion.text}
                  </p>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {suggestion.deliver_as.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400">
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveAISuggestions;
