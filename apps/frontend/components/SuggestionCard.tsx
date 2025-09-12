'use client';

import { useState } from 'react';
import { Check, X, MessageSquare, Eye, Mail, Zap, AlertTriangle, Target } from 'lucide-react';

interface Suggestion {
  text: string;
  offer_id: string;
  type: 'upsell' | 'cross-sell' | 'retention' | 'new-offer' | 'solution' | 'question' | 'offer' | 'follow_up' | 'competitor_response';
  confidence: number;
  deliver_as: 'say' | 'show' | 'email' | 'immediate_response' | 'follow_up_question' | 'next_step';
  core_highlight?: string;
  priority?: 'high' | 'medium' | 'low';
  competitor_analysis?: {
    competitor_name?: string;
    foodhub_advantage: string;
    competitor_weakness: string;
  };
}

interface CompetitorContainer {
  competitor_name: string;
  has: string[];
  does_not_have: string[];
  why_choose_foodhub: string[];
}

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAction: (suggestion: Suggestion, action: 'accept' | 'reject') => void;
}

export function SuggestionCard({ suggestion, onAction }: SuggestionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = async (action: 'accept' | 'reject') => {
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
    onAction(suggestion, action);
    setIsProcessing(false);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'upsell':
        return 'suggestion-upsell';
      case 'cross-sell':
        return 'suggestion-cross-sell';
      case 'retention':
        return 'suggestion-retention';
      case 'new-offer':
        return 'suggestion-new-offer';
      case 'product_recommendation':
        return 'suggestion-product-recommendation';
      case 'solution_consultation':
        return 'suggestion-solution-consultation';
      case 'business_growth':
        return 'suggestion-business-growth';
      case 'technical_support':
        return 'suggestion-technical-support';
      case 'pricing_inquiry':
        return 'suggestion-pricing-inquiry';
      default:
        return 'suggestion-upsell';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'upsell':
        return 'Upsell';
      case 'cross-sell':
        return 'Cross-sell';
      case 'retention':
        return 'Retention';
      case 'new-offer':
        return 'New Offer';
      case 'solution':
        return '⚡ Solution';
      case 'question':
        return '❓ Question';
      case 'offer':
        return '🎯 Offer';
      case 'follow_up':
        return '📞 Follow Up';
      case 'competitor_response':
        return '🏆 Competitor Response';
      case 'product_recommendation':
        return '🛍️ Product Recommendation';
      case 'solution_consultation':
        return '💡 Solution Consultation';
      case 'business_growth':
        return '📈 Business Growth';
      case 'technical_support':
        return '🔧 Technical Support';
      case 'pricing_inquiry':
        return '💰 Pricing Inquiry';
      default:
        return 'Suggestion';
    }
  };

  const getDeliverIcon = (deliverAs: string) => {
    switch (deliverAs) {
      case 'say':
        return <MessageSquare className="w-4 h-4" />;
      case 'show':
        return <Eye className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'immediate_response':
        return <Zap className="w-4 h-4" />;
      case 'follow_up_question':
        return <MessageSquare className="w-4 h-4" />;
      case 'next_step':
        return <Target className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <Target className="w-3 h-3" />;
      case 'low':
        return <MessageSquare className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success-600';
    if (confidence >= 0.6) return 'text-warning-600';
    return 'text-danger-600';
  };

  return (
    <div className={`suggestion-card ${getTypeColor(suggestion.type)} ${suggestion.priority === 'high' ? 'border-l-4 border-red-500' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-600 bg-white px-2 py-1 rounded">
            {getTypeLabel(suggestion.type)}
          </span>
          {suggestion.priority && (
            <span className={`text-xs font-medium px-2 py-1 rounded flex items-center space-x-1 ${getPriorityColor(suggestion.priority)}`}>
              {getPriorityIcon(suggestion.priority)}
              <span className="capitalize">{suggestion.priority}</span>
            </span>
          )}
          <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
            {Math.round(suggestion.confidence * 100)}% confidence
          </span>
        </div>
        <div className="flex items-center space-x-1 text-gray-500">
          {getDeliverIcon(suggestion.deliver_as)}
          <span className="text-xs capitalize">{suggestion.deliver_as.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Core Highlight - Most Important */}
      {suggestion.core_highlight && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-3">
          <div className="flex items-center">
            <Target className="w-4 h-4 text-yellow-600 mr-2" />
            <span className="text-sm font-semibold text-yellow-800">Key Point to Emphasize:</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1 font-medium">
            {suggestion.core_highlight}
          </p>
        </div>
      )}

      <p className="text-gray-800 mb-3 leading-relaxed">
        {suggestion.text}
      </p>

      {/* Competitor Analysis */}
      {suggestion.competitor_analysis && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <div className="flex items-center mb-2">
            <span className="text-sm font-semibold text-blue-800">vs {suggestion.competitor_analysis.competitor_name}</span>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-green-700">✅ FoodHub Advantage:</span>
              <p className="text-xs text-green-600 mt-1">{suggestion.competitor_analysis.foodhub_advantage}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-red-700">❌ They Lack:</span>
              <p className="text-xs text-red-600 mt-1">{suggestion.competitor_analysis.competitor_weakness}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Offer ID: {suggestion.offer_id}
        </span>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleAction('reject')}
            disabled={isProcessing}
            className="btn btn-danger text-xs px-3 py-1 flex items-center space-x-1"
          >
            <X className="w-3 h-3" />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleAction('accept')}
            disabled={isProcessing}
            className="btn btn-success text-xs px-3 py-1 flex items-center space-x-1"
          >
            <Check className="w-3 h-3" />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
