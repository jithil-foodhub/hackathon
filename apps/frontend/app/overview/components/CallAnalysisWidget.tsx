"use client";

import React, { memo, useMemo } from 'react';
import { Phone, Clock, TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { BaseWidgetProps } from '../types/overview';

// Simple Line Chart Component
const SimpleLineChart = memo(({ data, height = 120 }: {
  data: Array<{ time: string; calls: number; success: number }>;
  height?: number;
}) => {
  const maxCalls = Math.max(...data.map(d => d.calls));
  const maxSuccess = Math.max(...data.map(d => d.success));
  const maxValue = Math.max(maxCalls, maxSuccess);
  
  if (maxValue === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p className="text-sm">No data available</p>
      </div>
    );
  }

  const points = data.length;
  const width = 100; // percentage

  const getPath = (dataKey: 'calls' | 'success') => {
    return data
      .map((item, index) => {
        const x = (index / (points - 1)) * width;
        const y = height - ((item[dataKey] / maxValue) * height * 0.8) - height * 0.1;
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Grid lines */}
        {Array.from({ length: 4 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1={height * 0.2 + (i * height * 0.2)}
            x2={width}
            y2={height * 0.2 + (i * height * 0.2)}
            stroke="#f1f5f9"
            strokeWidth="1"
          />
        ))}
        
        {/* Calls line */}
        <path
          d={getPath('calls')}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        
        {/* Success line */}
        <path
          d={getPath('success')}
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          className="drop-shadow-sm"
        />
        
        {/* Data points */}
        {data.map((item, index) => {
          const x = (index / (points - 1)) * width;
          const yCall = height - ((item.calls / maxValue) * height * 0.8) - height * 0.1;
          const ySuccess = height - ((item.success / maxValue) * height * 0.8) - height * 0.1;
          
          return (
            <g key={index}>
              <circle cx={x} cy={yCall} r="3" fill="#3B82F6" className="drop-shadow-sm" />
              <circle cx={x} cy={ySuccess} r="3" fill="#10B981" className="drop-shadow-sm" />
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="absolute top-2 right-2 flex space-x-4 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span className="text-slate-600">Total</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-slate-600">Success</span>
        </div>
      </div>
    </div>
  );
});

SimpleLineChart.displayName = 'SimpleLineChart';

// Issue Badge Component
const IssueBadge = memo(({ issue, count, severity }: {
  issue: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}) => {
  const getSeverityStyle = () => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getSeverityIcon = () => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-3 h-3" />;
      case 'medium':
        return <Clock className="w-3 h-3" />;
      default:
        return <CheckCircle className="w-3 h-3" />;
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityStyle()}`}>
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {getSeverityIcon()}
        <span className="text-sm font-medium truncate">{issue}</span>
      </div>
      <div className="flex items-center space-x-1 text-sm font-bold">
        <span>{count}</span>
      </div>
    </div>
  );
});

IssueBadge.displayName = 'IssueBadge';

export const CallAnalysisWidget = memo(({ data, isLoading, error, className = '' }: BaseWidgetProps) => {
  const processedData = useMemo(() => {
    if (!data?.callAnalysis) return null;

    const { callAnalysis } = data;
    const totalDurationHours = (callAnalysis.totalDuration || 0) / 60;
    const avgDurationMinutes = callAnalysis.averageDuration || 0;
    
    return {
      totalDurationHours,
      avgDurationMinutes,
      successRate: callAnalysis.successRate || 0,
      conversionRate: callAnalysis.conversionRate || 0,
      topIssues: callAnalysis.topIssues || [],
      callTrends: callAnalysis.callTrends || []
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
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="h-32 bg-slate-200 rounded-lg animate-pulse mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse" />
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
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-slate-600">Failed to load call analysis</p>
          <p className="text-sm text-slate-500 mt-1">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Phone className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Call Analysis</h3>
            <p className="text-sm text-slate-600">Performance overview and insights</p>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {processedData.totalDurationHours.toFixed(1)}h
            </div>
            <div className="text-sm text-slate-600">Total Duration</div>
          </div>
          
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-slate-900 mb-1">
              {processedData.avgDurationMinutes.toFixed(1)}m
            </div>
            <div className="text-sm text-slate-600">Avg Duration</div>
          </div>
          
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {processedData.successRate.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600">Success Rate</div>
          </div>
          
          <div className="text-center p-4 bg-slate-50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {processedData.conversionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600">Conversion</div>
          </div>
        </div>

        {/* Call Trends Chart */}
        {processedData.callTrends.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-medium text-slate-700">24-Hour Call Trends</h4>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <SimpleLineChart data={processedData.callTrends.slice(-12)} height={120} />
            </div>
          </div>
        )}

        {/* Top Issues */}
        {processedData.topIssues.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-medium text-slate-700">Top Issues</h4>
            </div>
            <div className="space-y-3">
              {processedData.topIssues.slice(0, 4).map((issue, index) => (
                <IssueBadge
                  key={index}
                  issue={issue.issue}
                  count={issue.count}
                  severity={issue.severity}
                />
              ))}
            </div>
            
            {processedData.topIssues.length > 4 && (
              <div className="mt-3 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all issues ({processedData.topIssues.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span>Real-time data</span>
          </div>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
});

CallAnalysisWidget.displayName = 'CallAnalysisWidget';