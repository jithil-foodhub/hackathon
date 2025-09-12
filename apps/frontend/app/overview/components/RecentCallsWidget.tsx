"use client";

import React, { memo, useMemo } from 'react';
import { Phone, Clock, MessageSquare, TrendingUp, User, Tag, ExternalLink } from 'lucide-react';
import { BaseWidgetProps } from '../types/overview';

// Call Status Badge Component
const CallStatusBadge = memo(({ status }: { status: 'completed' | 'missed' | 'ongoing' }) => {
  const styles = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    missed: 'bg-red-100 text-red-800 border-red-200',
    ongoing: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const icons = {
    completed: '✓',
    missed: '✗',
    ongoing: '○'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
      <span className="mr-1">{icons[status]}</span>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
});

CallStatusBadge.displayName = 'CallStatusBadge';

// Outcome Badge Component
const OutcomeBadge = memo(({ outcome }: { outcome: 'lead' | 'sale' | 'support' | 'other' }) => {
  const styles = {
    sale: 'bg-green-50 text-green-700',
    lead: 'bg-blue-50 text-blue-700',
    support: 'bg-purple-50 text-purple-700',
    other: 'bg-slate-50 text-slate-700'
  };

  const icons = {
    sale: '💰',
    lead: '🎯',
    support: '🛠️',
    other: '📋'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${styles[outcome]}`}>
      <span className="mr-1">{icons[outcome]}</span>
      {outcome.charAt(0).toUpperCase() + outcome.slice(1)}
    </span>
  );
});

OutcomeBadge.displayName = 'OutcomeBadge';

// Sentiment Indicator Component
const SentimentIndicator = memo(({ sentiment }: { sentiment: number }) => {
  const getColor = () => {
    if (sentiment >= 0.7) return 'text-green-600';
    if (sentiment >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEmoji = () => {
    if (sentiment >= 0.7) return '😊';
    if (sentiment >= 0.4) return '😐';
    return '😞';
  };

  return (
    <div className="flex items-center space-x-1">
      <span>{getEmoji()}</span>
      <span className={`text-sm font-medium ${getColor()}`}>
        {(sentiment * 100).toFixed(0)}%
      </span>
    </div>
  );
});

SentimentIndicator.displayName = 'SentimentIndicator';

// Call Card Component
const CallCard = memo(({ call }: { call: any }) => {
  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration);
    const seconds = Math.floor((duration % 1) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const callTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - callTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return callTime.toLocaleDateString();
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">
              {call.clientName || call.clientPhone}
            </h4>
            <p className="text-sm text-slate-600">{call.clientPhone}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <CallStatusBadge status={call.status} />
          <span className="text-xs text-slate-500">{formatTime(call.timestamp)}</span>
        </div>
      </div>

      {/* Call Details */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-slate-600">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(call.duration)}</span>
          </div>
          
          {call.agentId && (
            <div className="flex items-center space-x-1 text-slate-600">
              <User className="w-3 h-3" />
              <span>Agent {call.agentId.slice(-3)}</span>
            </div>
          )}
        </div>
        
        <SentimentIndicator sentiment={call.sentiment} />
      </div>

      {/* Summary */}
      {call.summary && (
        <p className="text-sm text-slate-700 mb-3 line-clamp-2">
          {call.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <OutcomeBadge outcome={call.outcome} />
          
          {call.tags && call.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-500">
                +{call.tags.length} tags
              </span>
            </div>
          )}
        </div>
        
        <button className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors">
          <span>View Details</span>
          <ExternalLink className="w-3 h-3 ml-1" />
        </button>
      </div>
    </div>
  );
});

CallCard.displayName = 'CallCard';

// Summary Stats Component
const CallsSummary = memo(({ calls }: { calls: any[] }) => {
  const stats = useMemo(() => {
    const completed = calls.filter(c => c.status === 'completed').length;
    const avgDuration = calls.length > 0 
      ? calls.reduce((acc, call) => acc + call.duration, 0) / calls.length 
      : 0;
    const avgSentiment = calls.length > 0 
      ? calls.reduce((acc, call) => acc + call.sentiment, 0) / calls.length 
      : 0;
    const outcomes = calls.reduce((acc, call) => {
      acc[call.outcome] = (acc[call.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: calls.length,
      completed,
      completionRate: calls.length > 0 ? (completed / calls.length) * 100 : 0,
      avgDuration,
      avgSentiment,
      outcomes
    };
  }, [calls]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-slate-200">
      <div className="text-center">
        <p className="text-sm text-slate-600">Total Calls</p>
        <p className="text-xl font-bold text-slate-900">{stats.total}</p>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-slate-600">Completion</p>
        <p className="text-xl font-bold text-green-600">{stats.completionRate.toFixed(0)}%</p>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-slate-600">Avg Duration</p>
        <p className="text-xl font-bold text-slate-900">
          {Math.floor(stats.avgDuration)}:{Math.floor((stats.avgDuration % 1) * 60).toString().padStart(2, '0')}
        </p>
      </div>
      
      <div className="text-center">
        <p className="text-sm text-slate-600">Avg Sentiment</p>
        <p className="text-xl font-bold text-purple-600">{(stats.avgSentiment * 100).toFixed(0)}%</p>
      </div>
    </div>
  );
});

CallsSummary.displayName = 'CallsSummary';

export const RecentCallsWidget = memo(({ data, isLoading, error, className = '' }: BaseWidgetProps) => {
  const processedData = useMemo(() => {
    if (!data?.recentCalls) return null;

    // Sort calls by timestamp (most recent first)
    const sortedCalls = [...data.recentCalls].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sortedCalls;
  }, [data]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />
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
            <MessageSquare className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-slate-600">Failed to load recent calls</p>
          <p className="text-sm text-slate-500 mt-1">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Phone className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-600">No recent calls</p>
          <p className="text-sm text-slate-500 mt-1">Call data will appear here when available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Recent Calls</h3>
            <p className="text-sm text-slate-600">Latest call activity</p>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-6">
          <CallsSummary calls={processedData} />
        </div>

        {/* Calls List */}
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {processedData.slice(0, 5).map((call) => (
            <CallCard key={call.id} call={call} />
          ))}
        </div>

        {/* View More */}
        {processedData.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
              View all {processedData.length} calls
            </button>
          </div>
        )}

        {/* Status Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span>Live call feed • Last updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

RecentCallsWidget.displayName = 'RecentCallsWidget';