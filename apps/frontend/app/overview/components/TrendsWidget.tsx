"use client";

import React, { memo, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3, Calendar, Activity } from 'lucide-react';
import { BaseWidgetProps } from '../types/overview';

// Simple Trend Line Component
const TrendLine = memo(({ data, color = '#3B82F6', height = 60 }: {
  data: Array<{ date: string; calls?: number; sentiment?: number; value?: number }>;
  color?: string;
  height?: number;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p className="text-sm">No data</p>
      </div>
    );
  }

  const values = data.map(d => d.calls || d.sentiment || d.value || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue;
  
  if (valueRange === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p className="text-sm">No variation</p>
      </div>
    );
  }

  const points = data.length;
  const width = 100;

  const pathData = data
    .map((item, index) => {
      const x = (index / (points - 1)) * width;
      const value = item.calls || item.sentiment || item.value || 0;
      const y = height - ((value - minValue) / valueRange) * (height * 0.8) - height * 0.1;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Background gradient */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Area under curve */}
        <path
          d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#gradient-${color.replace('#', '')})`}
        />
        
        {/* Trend line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (points - 1)) * width;
          const value = item.calls || item.sentiment || item.value || 0;
          const y = height - ((value - minValue) / valueRange) * (height * 0.8) - height * 0.1;
          
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              className="drop-shadow-sm"
            />
          );
        })}
      </svg>
    </div>
  );
});

TrendLine.displayName = 'TrendLine';

// Trend Metric Card Component
const TrendMetricCard = memo(({ title, data, color, icon, unit = '' }: {
  title: string;
  data: any[];
  color: string;
  icon: React.ReactNode;
  unit?: string;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-slate-200 rounded-lg text-slate-400">
              {icon}
            </div>
            <span className="text-sm font-medium text-slate-600">{title}</span>
          </div>
        </div>
        <p className="text-sm text-slate-400">No data available</p>
      </div>
    );
  }

  const values = data.map(d => d.calls || d.sentiment || d.value || 0);
  const currentValue = values[values.length - 1] || 0;
  const previousValue = values[values.length - 2] || currentValue;
  const change = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          <span className="text-sm font-medium text-slate-700">{title}</span>
        </div>
        
        <div className="flex items-center space-x-1 text-sm">
          {change > 0 ? (
            <TrendingUp className="w-3 h-3 text-green-600" />
          ) : change < 0 ? (
            <TrendingDown className="w-3 h-3 text-red-600" />
          ) : null}
          <span className={`font-medium ${
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-slate-600'
          }`}>
            {change !== 0 ? `${Math.abs(change).toFixed(1)}%` : '0%'}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-2xl font-bold text-slate-900">
          {typeof currentValue === 'number' ? 
            (unit === '%' ? (currentValue * 100).toFixed(1) : currentValue.toLocaleString()) : 
            currentValue
          }
        </span>
        {unit && <span className="text-sm text-slate-600 ml-1">{unit}</span>}
      </div>

      <div style={{ height: '60px' }}>
        <TrendLine data={data.slice(-7)} color={color} height={60} />
      </div>
    </div>
  );
});

TrendMetricCard.displayName = 'TrendMetricCard';

// Topic Trend Component
const TopicTrendCard = memo(({ topic }: { topic: any }) => {
  const totalMentions = topic.timeline?.reduce((sum: number, item: any) => sum + (item.mentions || 0), 0) || 0;
  const recentMentions = topic.timeline?.[topic.timeline.length - 1]?.mentions || 0;
  const previousMentions = topic.timeline?.[topic.timeline.length - 2]?.mentions || recentMentions;
  const mentionChange = previousMentions !== 0 ? ((recentMentions - previousMentions) / previousMentions) * 100 : 0;

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className="w-10 h-6">
          {topic.timeline && (
            <TrendLine 
              data={topic.timeline} 
              color="#8B5CF6" 
              height={24}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{topic.topic}</p>
          <p className="text-xs text-slate-500">{totalMentions} total mentions</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 text-sm">
        <span className="font-medium text-slate-900">{recentMentions}</span>
        {mentionChange !== 0 && (
          <div className="flex items-center space-x-1">
            {mentionChange > 0 ? (
              <TrendingUp className="w-3 h-3 text-green-600" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600" />
            )}
            <span className={mentionChange > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(mentionChange).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

TopicTrendCard.displayName = 'TopicTrendCard';

export const TrendsWidget = memo(({ data, isLoading, error, className = '' }: BaseWidgetProps) => {
  const [activeView, setActiveView] = useState<'overview' | 'topics'>('overview');

  const processedData = useMemo(() => {
    if (!data?.trends) return null;

    const { trends } = data;
    return {
      callVolumeTrend: trends.callVolumeTrend || [],
      sentimentTrend: trends.sentimentTrend || [],
      performanceTrend: trends.performanceTrend || [],
      topicTrends: trends.topicTrends || []
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 bg-slate-200 rounded w-24 animate-pulse" />
          </div>
          <div className="space-y-4">
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
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-slate-600">Failed to load trends</p>
          <p className="text-sm text-slate-500 mt-1">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Trends</h3>
              <p className="text-sm text-slate-600">Pattern analysis</p>
            </div>
          </div>
          
          {/* View Toggle */}
          <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeView === 'overview'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('topics')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeView === 'topics'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Topics
            </button>
          </div>
        </div>

        {/* Content */}
        {activeView === 'overview' ? (
          <div className="space-y-4">
            {/* Overview Metrics */}
            <TrendMetricCard
              title="Call Volume"
              data={processedData.callVolumeTrend}
              color="#3B82F6"
              icon={<Activity className="w-4 h-4" />}
            />
            
            <TrendMetricCard
              title="Sentiment Score"
              data={processedData.sentimentTrend}
              color="#10B981"
              icon={<TrendingUp className="w-4 h-4" />}
              unit="%"
            />
            
            {processedData.performanceTrend.length > 0 && (
              <TrendMetricCard
                title="Performance"
                data={processedData.performanceTrend}
                color="#F59E0B"
                icon={<BarChart3 className="w-4 h-4" />}
                unit="%"
              />
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {processedData.topicTrends.length > 0 ? (
              processedData.topicTrends.map((topic, index) => (
                <TopicTrendCard key={index} topic={topic} />
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p>No topic trends available</p>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {activeView === 'overview' && (
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <p className="text-slate-600">Tracking Period</p>
                <p className="font-semibold text-slate-900">
                  {processedData.callVolumeTrend.length} days
                </p>
              </div>
              <div className="text-center">
                <p className="text-slate-600">Data Points</p>
                <p className="font-semibold text-slate-900">
                  {processedData.callVolumeTrend.length + processedData.sentimentTrend.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span>Historical trend analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
});

TrendsWidget.displayName = 'TrendsWidget';