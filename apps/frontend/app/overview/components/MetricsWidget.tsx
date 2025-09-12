"use client";

import React, { memo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Phone, 
  Clock, 
  Heart, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { BaseWidgetProps } from '../types/overview';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'stable';
}

const MetricCard = memo(({ title, value, change, unit, icon, color, trend }: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-3 h-3 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-2xl font-bold text-slate-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-sm text-slate-600 ml-1">{unit}</span>}
        </p>
        <p className="text-sm text-slate-600 font-medium">{title}</p>
      </div>
    </div>
  );
});

MetricCard.displayName = 'MetricCard';

export const MetricsWidget = memo(({ data, isLoading, error, className = '' }: BaseWidgetProps) => {
  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="h-6 bg-slate-200 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-100 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-full mb-3" />
                <div className="h-8 bg-slate-200 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.metrics) {
    return (
      <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <TrendingDown className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-slate-600">Failed to load metrics</p>
          <p className="text-sm text-slate-500 mt-1">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const { metrics } = data;

  // Safe data extraction with fallbacks
  const callVolume = metrics.callVolume || {};
  const responseTime = metrics.responseTime || {};
  const satisfaction = metrics.customerSatisfaction || {};
  const conversion = metrics.conversionMetrics || {};

  const metricsData = [
    {
      title: 'Total Calls Today',
      value: callVolume.today || 0,
      change: callVolume.growth || 0,
      icon: <Phone className="w-5 h-5 text-blue-600" />,
      color: 'bg-blue-100',
      trend: (callVolume.growth || 0) > 0 ? 'up' : (callVolume.growth || 0) < 0 ? 'down' : 'stable'
    },
    {
      title: 'Avg Response Time',
      value: (responseTime.average || 0).toFixed(1),
      change: responseTime.performance ? ((responseTime.performance - 100)) : 0,
      unit: 'sec',
      icon: <Clock className="w-5 h-5 text-orange-600" />,
      color: 'bg-orange-100',
      trend: (responseTime.average || 0) < (responseTime.target || 15) ? 'up' : 'down'
    },
    {
      title: 'Customer Satisfaction',
      value: (satisfaction.score || 0).toFixed(1),
      change: satisfaction.trend === 'up' ? 5.2 : satisfaction.trend === 'down' ? -2.1 : 0,
      unit: '/5',
      icon: <Heart className="w-5 h-5 text-pink-600" />,
      color: 'bg-pink-100',
      trend: satisfaction.trend || 'stable'
    },
    {
      title: 'Conversion Rate',
      value: (conversion.rate || 0).toFixed(1),
      change: conversion.rate ? ((conversion.rate - 20) / 20 * 100) : 0,
      unit: '%',
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      color: 'bg-green-100',
      trend: (conversion.rate || 0) > 20 ? 'up' : (conversion.rate || 0) < 15 ? 'down' : 'stable'
    }
  ];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Key Metrics</h3>
            <p className="text-sm text-slate-600">Real-time performance indicators</p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {metricsData.map((metric, index) => (
            <MetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              unit={metric.unit}
              icon={metric.icon}
              color={metric.color}
              trend={metric.trend as 'up' | 'down' | 'stable'}
            />
          ))}
        </div>

        {/* Additional Insights */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Revenue Today</span>
              <span className="font-semibold text-slate-900">
                ${(conversion.revenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Active Leads</span>
              <span className="font-semibold text-slate-900">{conversion.leads || 0}</span>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live data • Updated {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

MetricsWidget.displayName = 'MetricsWidget';