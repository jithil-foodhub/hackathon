"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { 
  LayoutGrid, 
  Settings, 
  RefreshCw,
  Activity,
  TrendingUp,
  Users,
  Phone
} from "lucide-react";
import { CallAnalysisWidget } from "./components/CallAnalysisWidget";
import { SentimentWidget } from "./components/SentimentWidget";
import { MetricsWidget } from "./components/MetricsWidget";
import { AISparklingWidget } from "./components/AISparklingWidget";
import { PerformanceWidget } from "./components/PerformanceWidget";
import { RecentCallsWidget } from "./components/RecentCallsWidget";
import { TrendsWidget } from "./components/TrendsWidget";
import { LayoutCustomizer } from "./components/LayoutCustomizer";
import { sampleOverviewData } from "./data/sampleData";
import { OverviewData, LayoutConfig, LayoutType } from "./types/overview";

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutType, setLayoutType] = useState<LayoutType>("default");
  const [showLayoutCustomizer, setShowLayoutCustomizer] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const layoutConfigs: Record<LayoutType, LayoutConfig> = {
    default: {
      gridCols: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
      widgets: [
        { id: "metrics", size: "md:col-span-2", priority: 1 },
        { id: "sentiment", size: "lg:col-span-2", priority: 2 },
        { id: "callAnalysis", size: "md:col-span-2 lg:col-span-3", priority: 3 },
        { id: "aiSuggestions", size: "lg:col-span-1", priority: 4 },
        { id: "performance", size: "md:col-span-1", priority: 5 },
        { id: "trends", size: "md:col-span-1", priority: 6 },
        { id: "recentCalls", size: "md:col-span-2 lg:col-span-2", priority: 7 }
      ]
    },
    compact: {
      gridCols: "grid-cols-1 md:grid-cols-3 lg:grid-cols-6",
      widgets: [
        { id: "metrics", size: "md:col-span-3", priority: 1 },
        { id: "sentiment", size: "md:col-span-2", priority: 2 },
        { id: "aiSuggestions", size: "md:col-span-1", priority: 3 },
        { id: "callAnalysis", size: "md:col-span-3", priority: 4 },
        { id: "performance", size: "md:col-span-2", priority: 5 },
        { id: "trends", size: "md:col-span-1", priority: 6 },
        { id: "recentCalls", size: "md:col-span-3", priority: 7 }
      ]
    },
    analytics: {
      gridCols: "grid-cols-1 lg:grid-cols-3",
      widgets: [
        { id: "performance", size: "lg:col-span-2", priority: 1 },
        { id: "sentiment", size: "lg:col-span-1", priority: 2 },
        { id: "trends", size: "lg:col-span-1", priority: 3 },
        { id: "callAnalysis", size: "lg:col-span-2", priority: 4 },
        { id: "metrics", size: "lg:col-span-3", priority: 5 },
        { id: "aiSuggestions", size: "lg:col-span-2", priority: 6 },
        { id: "recentCalls", size: "lg:col-span-1", priority: 7 }
      ]
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use sample data for now
      setData(sampleOverviewData);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview data');
      console.error('Error fetching overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOverviewData();
    setIsRefreshing(false);
  };

  const renderWidget = (widgetId: string, className?: string) => {
    const baseProps = {
      data: data!,
      isLoading: false,
      error: null,
      className: `h-full ${className || ''}`
    };

    switch (widgetId) {
      case 'metrics':
        return <MetricsWidget {...baseProps} />;
      case 'sentiment':
        return <SentimentWidget {...baseProps} />;
      case 'callAnalysis':
        return <CallAnalysisWidget {...baseProps} />;
      case 'aiSuggestions':
        return <AISparklingWidget {...baseProps} />;
      case 'performance':
        return <PerformanceWidget {...baseProps} />;
      case 'trends':
        return <TrendsWidget {...baseProps} />;
      case 'recentCalls':
        return <RecentCallsWidget {...baseProps} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <AppLayout currentScreen="overview">
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 font-medium">Loading overview...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout currentScreen="overview">
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to load overview</h3>
            <p className="text-slate-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentLayout = layoutConfigs[layoutType];

  return (
    <AppLayout currentScreen="overview">
      <div className="p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-full">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Overview Dashboard
                </h1>
                <p className="text-xl text-slate-600">
                  Comprehensive insights into your call center performance
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setShowLayoutCustomizer(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Customize Layout
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          {data && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Total Calls Today</p>
                    <p className="text-2xl font-bold text-slate-900">{data.quickStats?.totalCalls || 0}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Active Clients</p>
                    <p className="text-2xl font-bold text-slate-900">{data.quickStats?.activeClients || 0}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Avg Sentiment</p>
                    <p className="text-2xl font-bold text-slate-900">{((data.quickStats?.avgSentiment || 0) * 100).toFixed(0)}%</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 font-medium">Performance</p>
                    <p className="text-2xl font-bold text-slate-900">{data.quickStats?.performance || 0}%</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bento Grid Layout */}
          {data && (
            <div className={`grid ${currentLayout.gridCols} gap-6 auto-rows-min`}>
              {currentLayout.widgets
                .sort((a, b) => a.priority - b.priority)
                .map((widget) => (
                  <div 
                    key={widget.id} 
                    className={`${widget.size} min-h-[300px]`}
                  >
                    {renderWidget(widget.id)}
                  </div>
                ))}
            </div>
          )}

          {/* Layout Customizer Modal */}
          {showLayoutCustomizer && (
            <LayoutCustomizer
              currentLayout={layoutType}
              onLayoutChange={setLayoutType}
              onClose={() => setShowLayoutCustomizer(false)}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}