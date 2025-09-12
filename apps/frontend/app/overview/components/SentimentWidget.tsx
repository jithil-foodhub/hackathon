"use client";

import React, { memo, useMemo } from 'react';
import { Heart, TrendingUp, BarChart3, Smile, Frown, Meh } from 'lucide-react';
import { BaseWidgetProps } from '../types/overview';

// Simple Progress Circle Component
const ProgressCircle = memo(({ percentage, size = 80, strokeWidth = 6, color = '#3B82F6' }: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-slate-900">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
});

ProgressCircle.displayName = 'ProgressCircle';

// Simple Bar Chart Component
const SimpleBarChart = memo(({ data, height = 120 }: {
  data: Array<{ time: string; sentiment: number; volume: number }>;
  height?: number;
}) => {
  const maxSentiment = Math.max(...data.map(d => d.sentiment));
  const maxVolume = Math.max(...data.map(d => d.volume));

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex items-end justify-between h-full space-x-1">
        {data.map((item, index) => {
          const sentimentHeight = (item.sentiment / maxSentiment) * height * 0.8;
          const volumeHeight = (item.volume / maxVolume) * height * 0.6;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-full relative mb-1">
                {/* Sentiment bar */}
                <div
                  className="w-1/2 bg-blue-400 rounded-t transition-all duration-700"
                  style={{ height: sentimentHeight }}
                />
                {/* Volume bar */}
                <div
                  className="w-1/2 bg-blue-200 rounded-t transition-all duration-700 absolute right-0 bottom-0"
                  style={{ height: volumeHeight }}
                />
              </div>
              <span className="text-xs text-slate-600 truncate w-full text-center">
                {item.time.split('-').pop()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

SimpleBarChart.displayName = 'SimpleBarChart';

export const SentimentWidget = memo(({ data, isLoading, error, className = '' }: BaseWidgetProps) => {
  const processedData = useMemo(() => {
    if (!data?.sentiment) return null;

    const { sentiment } = data;
    const overallPercentage = (sentiment.overall || 0) * 100;
    
    return {
      overall: overallPercentage,
      distribution: sentiment.distribution || { positive: 0, neutral: 0, negative: 0 },
      trends: sentiment.trends || [],
      emotions: sentiment.emotionalInsights || []
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
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />
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
            <Frown className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-slate-600">Failed to load sentiment data</p>
          <p className="text-sm text-slate-500 mt-1">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const getSentimentIcon = (score: number) => {
    if (score >= 75) return <Smile className="w-5 h-5 text-green-600" />;
    if (score >= 50) return <Meh className="w-5 h-5 text-yellow-600" />;
    return <Frown className="w-5 h-5 text-red-600" />;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 75) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Sentiment Analysis</h3>
              <p className="text-sm text-slate-600">Customer emotion insights</p>
            </div>
          </div>
          {getSentimentIcon(processedData.overall)}
        </div>

        {/* Overall Sentiment Circle */}
        <div className="flex justify-center mb-6">
          <ProgressCircle
            percentage={processedData.overall}
            color={getSentimentColor(processedData.overall)}
            size={100}
          />
        </div>

        {/* Distribution Bars */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span className="text-sm text-slate-600">Positive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 max-w-[100px] bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${processedData.distribution.positive}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-900 w-8 text-right">
                {processedData.distribution.positive}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <span className="text-sm text-slate-600">Neutral</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 max-w-[100px] bg-slate-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${processedData.distribution.neutral}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-900 w-8 text-right">
                {processedData.distribution.neutral}%
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <span className="text-sm text-slate-600">Negative</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 max-w-[100px] bg-slate-200 rounded-full h-2">
                <div
                  className="bg-red-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${processedData.distribution.negative}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-900 w-8 text-right">
                {processedData.distribution.negative}%
              </span>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        {processedData.trends.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">7-Day Trend</span>
            </div>
            <SimpleBarChart data={processedData.trends} height={80} />
          </div>
        )}

        {/* Emotional Insights */}
        {processedData.emotions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <BarChart3 className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Emotional Breakdown</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {processedData.emotions.slice(0, 3).map((emotion, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: emotion.color }}
                    />
                    <span className="text-sm text-slate-600">{emotion.emotion}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {emotion.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span>Real-time analysis • {processedData.trends.length || 0} samples</span>
          </div>
        </div>
      </div>
    </div>
  );
});

SentimentWidget.displayName = 'SentimentWidget';