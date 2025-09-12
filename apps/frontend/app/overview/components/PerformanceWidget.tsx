"use client";

import React, { memo, useMemo } from 'react';
import { Activity, TrendingUp, TrendingDown, Target, Clock, Users } from 'lucide-react';
import { BaseWidgetProps } from '../types/overview';

// KPI Card Component
const KPICard = memo(({ kpi }: { kpi: any }) => {
  const getStatusColor = () => {
    switch (kpi.status) {
      case 'good':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = () => {
    switch (kpi.status) {
      case 'good':
        return <TrendingUp className="w-4 h-4" />;
      case 'warning':
        return <Clock className="w-4 h-4" />;
      case 'critical':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getTrendIcon = () => {
    if (kpi.trend > 0) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (kpi.trend < 0) return <TrendingDown className="w-3 h-3 text-red-600" />;
    return null;
  };

  const progressPercentage = Math.min((kpi.value / kpi.target) * 100, 100);

  return (
    <div className={`p-4 rounded-xl border-2 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${getStatusColor().replace('text-', 'text-').replace('bg-', 'bg-').replace('border-', 'border-')}`}>
          {getStatusIcon()}
        </div>
        {kpi.trend !== 0 && (
          <div className="flex items-center space-x-1 text-sm font-medium">
            {getTrendIcon()}
            <span className={kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(kpi.trend).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-slate-900 text-sm">{kpi.name}</h4>
        
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-slate-900">
            {typeof kpi.value === 'number' ? kpi.value.toFixed(1) : kpi.value}
          </span>
          <span className="text-sm text-slate-600">{kpi.unit}</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Target: {kpi.target}{kpi.unit}</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                kpi.status === 'good' ? 'bg-green-400' :
                kpi.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';

// Agent Performance Card Component
const AgentCard = memo(({ agent, rank }: { agent: any; rank: number }) => {
  const getRankBadge = () => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-bold text-slate-600">{getRankBadge()}</span>
        <div>
          <p className="font-medium text-slate-900">{agent.name || `Agent ${agent.agentId.slice(-3)}`}</p>
          <p className="text-xs text-slate-600">{agent.callsHandled} calls</p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900">{agent.satisfactionScore?.toFixed(1) || 0}/5</p>
        <p className="text-xs text-slate-600">{agent.conversionRate?.toFixed(1) || 0}% conv</p>
      </div>
    </div>
  );
});

AgentCard.displayName = 'AgentCard';

// Time-based Performance Chart Component
const TimePerformanceChart = memo(({ data }: { data: any[] }) => {
  const maxCalls = Math.max(...data.map(d => d.calls));
  const maxSatisfaction = 5; // satisfaction is out of 5

  return (
    <div className="w-full h-24">
      <div className="flex items-end justify-between h-full space-x-1">
        {data.slice(0, 12).map((item, index) => {
          const callHeight = (item.calls / maxCalls) * 100;
          const satisfactionHeight = (item.satisfaction / maxSatisfaction) * 100;
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 min-w-0">
              <div className="w-full relative mb-1" style={{ height: '60px' }}>
                {/* Calls bar */}
                <div
                  className="w-1/2 bg-blue-400 rounded-t transition-all duration-700 absolute bottom-0"
                  style={{ height: `${callHeight}%` }}
                />
                {/* Satisfaction bar */}
                <div
                  className="w-1/2 bg-green-400 rounded-t transition-all duration-700 absolute bottom-0 right-0"
                  style={{ height: `${satisfactionHeight}%` }}
                />
              </div>
              <span className="text-xs text-slate-600">
                {item.hour < 10 ? `0${item.hour}` : item.hour}h
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-end space-x-4 mt-2 text-xs text-slate-600">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
          <span>Calls</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full" />
          <span>Satisfaction</span>
        </div>
      </div>
    </div>
  );
});

TimePerformanceChart.displayName = 'TimePerformanceChart';

export const PerformanceWidget = memo(({ data, isLoading, error, className = '' }: BaseWidgetProps) => {
  const processedData = useMemo(() => {
    if (!data?.performance) return null;

    const { performance } = data;
    return {
      kpis: performance.kpis || [],
      agentPerformance: performance.agentPerformance || [],
      timeBasedMetrics: performance.timeBasedMetrics || []
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse" />
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
            <Activity className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-slate-600">Failed to load performance data</p>
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
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Performance</h3>
            <p className="text-sm text-slate-600">KPIs and team metrics</p>
          </div>
        </div>

        {/* KPIs Grid */}
        {processedData.kpis.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {processedData.kpis.slice(0, 4).map((kpi, index) => (
              <KPICard key={index} kpi={kpi} />
            ))}
          </div>
        )}

        {/* Time-based Performance */}
        {processedData.timeBasedMetrics.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-medium text-slate-700">Hourly Performance</h4>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <TimePerformanceChart data={processedData.timeBasedMetrics} />
            </div>
          </div>
        )}

        {/* Top Agents */}
        {processedData.agentPerformance.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Users className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-medium text-slate-700">Top Performers</h4>
            </div>
            <div className="space-y-2">
              {processedData.agentPerformance
                .sort((a, b) => (b.satisfactionScore || 0) - (a.satisfactionScore || 0))
                .slice(0, 3)
                .map((agent, index) => (
                  <AgentCard key={agent.agentId} agent={agent} rank={index + 1} />
                ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <p className="text-slate-600">Avg Performance</p>
              <p className="text-xl font-bold text-slate-900">
                {processedData.kpis.length > 0 
                  ? ((processedData.kpis.reduce((acc, kpi) => acc + (kpi.value / kpi.target * 100), 0) / processedData.kpis.length)).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-slate-600">Active Agents</p>
              <p className="text-xl font-bold text-slate-900">
                {processedData.agentPerformance.length}
              </p>
            </div>
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live performance data</span>
          </div>
        </div>
      </div>
    </div>
  );
});

PerformanceWidget.displayName = 'PerformanceWidget';