"use client";

import React, { memo, useState, useMemo } from 'react';
import { Sparkles, TrendingUp, Lightbulb, AlertCircle, Tag, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { BaseWidgetProps } from '../types/overview';

// Priority Badge Component
const PriorityBadge = memo(({ priority }: { priority: 'low' | 'medium' | 'high' | 'critical' }) => {
  const styles = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
});

PriorityBadge.displayName = 'PriorityBadge';

// Type Badge Component
const TypeBadge = memo(({ type }: { type: 'product' | 'sales' | 'tone' | 'process' | 'technical' }) => {
  const icons = {
    product: '📦',
    sales: '💰',
    tone: '🎭',
    process: '⚙️',
    technical: '🔧'
  };

  const colors = {
    product: 'bg-blue-50 text-blue-700',
    sales: 'bg-green-50 text-green-700',
    tone: 'bg-purple-50 text-purple-700',
    process: 'bg-indigo-50 text-indigo-700',
    technical: 'bg-gray-50 text-gray-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${colors[type]}`}>
      <span className="mr-1">{icons[type]}</span>
      {type}
    </span>
  );
});

TypeBadge.displayName = 'TypeBadge';

// Suggestion Card Component
const SuggestionCard = memo(({ suggestion, isExpanded, onToggle }: {
  suggestion: any;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <div className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TypeBadge type={suggestion.type} />
          <PriorityBadge priority={suggestion.priority} />
        </div>
        <span className="text-xs text-slate-500">{timeAgo(suggestion.createdAt)}</span>
      </div>

      <h4 className="font-medium text-slate-900 mb-2 line-clamp-2">{suggestion.title}</h4>
      
      <p className={`text-sm text-slate-600 mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}>
        {suggestion.description}
      </p>

      {isExpanded && (
        <div className="space-y-3 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Impact:</span>
            <span className="font-medium text-slate-900">{suggestion.impact}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Confidence:</span>
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${suggestion.confidence * 100}%` }}
                />
              </div>
              <span className="font-medium text-slate-900">{(suggestion.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>

          {suggestion.tags && suggestion.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestion.tags.map((tag: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 text-xs bg-white text-slate-600 rounded-md"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Show less</span>
              <ChevronUp className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              <span>Show more</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
        
        <button className="flex items-center text-sm text-slate-600 hover:text-slate-800 transition-colors">
          <span>Apply</span>
          <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
});

SuggestionCard.displayName = 'SuggestionCard';

// Trending Topic Component
const TrendingTopicCard = memo(({ topic }: { topic: any }) => {
  const getTrendIcon = () => {
    if (topic.growth > 0) return <TrendingUp className="w-3 h-3 text-green-600" />;
    return <TrendingUp className="w-3 h-3 text-red-600 transform rotate-180" />;
  };

  const getSentimentColor = () => {
    if (topic.sentiment > 0.7) return 'text-green-600';
    if (topic.sentiment > 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div>
          <p className="font-medium text-slate-900 truncate">{topic.topic}</p>
          <p className="text-xs text-slate-500">{topic.mentions} mentions</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 text-sm">
        <span className={`font-medium ${getSentimentColor()}`}>
          {(topic.sentiment * 100).toFixed(0)}%
        </span>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={topic.growth > 0 ? 'text-green-600' : 'text-red-600'}>
            {Math.abs(topic.growth).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
});

TrendingTopicCard.displayName = 'TrendingTopicCard';

export const AISparklingWidget = memo(({ data, isLoading, error, className = '' }: BaseWidgetProps) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'insights' | 'trending'>('suggestions');

  const processedData = useMemo(() => {
    if (!data?.aiSuggestions) return null;

    const { aiSuggestions } = data;
    return {
      suggestions: aiSuggestions.suggestions || [],
      insights: aiSuggestions.insights || [],
      trendingTopics: aiSuggestions.trendingTopics || []
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 bg-slate-200 rounded w-40 animate-pulse" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !processedData) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-slate-600">Failed to load AI suggestions</p>
          <p className="text-sm text-slate-500 mt-1">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'suggestions', label: 'Suggestions', count: processedData.suggestions.length },
    { id: 'insights', label: 'Insights', count: processedData.insights.length },
    { id: 'trending', label: 'Trending', count: processedData.trendingTopics.length }
  ];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
            <Sparkles className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">AI Insights</h3>
            <p className="text-sm text-slate-600">Smart recommendations and trends</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-slate-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'suggestions' && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {processedData.suggestions.slice(0, 4).map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isExpanded={expandedSuggestion === suggestion.id}
                  onToggle={() => setExpandedSuggestion(
                    expandedSuggestion === suggestion.id ? null : suggestion.id
                  )}
                />
              ))}
              {processedData.suggestions.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>No suggestions available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {processedData.insights.map((insight, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-md ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-600' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{insight.category}</h4>
                        {insight.actionable && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Actionable
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600">{insight.insight}</p>
                    </div>
                  </div>
                </div>
              ))}
              {processedData.insights.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>No insights available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trending' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {processedData.trendingTopics.map((topic, index) => (
                <TrendingTopicCard key={index} topic={topic} />
              ))}
              {processedData.trendingTopics.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p>No trending topics available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span>AI-powered insights • Updated continuously</span>
          </div>
        </div>
      </div>
    </div>
  );
});

AISparklingWidget.displayName = 'AISparklingWidget';