'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  MessageSquare, 
  Target, 
  Activity,
  PieChart,
  LineChart,
  Users,
  Star,
  AlertCircle,
  CheckCircle,
  Phone,
  Calendar
} from 'lucide-react';

interface CallRecord {
  _id: string;
  timestamp: string;
  callStartTime?: string;
  callEndTime?: string;
  duration: number;
  direction: 'inbound' | 'outbound';
  status: string;
  outcome: string;
  mood: 'positive' | 'neutral' | 'negative';
  sentiment: number;
  callAnalysis?: {
    summary: string;
    keyTopics: string[];
    customerEngagement: number;
    agentPerformance: number;
    conversationFlow: {
      segments: Array<{
        timestamp: number;
        speaker: 'customer' | 'agent';
        content: string;
        sentiment: number;
        topic?: string;
      }>;
    };
    metrics: {
      totalWords: number;
      customerWords: number;
      agentWords: number;
      speakingTimeRatio: number;
      averageResponseTime: number;
      interruptionCount: number;
      questionCount: number;
      objectionCount: number;
      agreementCount: number;
      solutionMentioned: boolean;
      nextStepsAgreed: boolean;
      customerSatisfaction: number;
    };
    insights: {
      strengths: string[];
      improvements: string[];
      recommendations: string[];
      riskFactors: string[];
    };
  };
}

interface ClientMetricsDashboardProps {
  clientId: string;
  callRecords: CallRecord[];
}

export function ClientMetricsDashboard({ clientId, callRecords }: ClientMetricsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  // Calculate aggregated metrics
  const calculateMetrics = () => {
    const recordsWithAnalysis = callRecords.filter(call => call.callAnalysis);
    
    if (recordsWithAnalysis.length === 0) {
      return {
        totalCalls: callRecords.length,
        averageDuration: 0,
        averageSatisfaction: 0,
        averageEngagement: 0,
        averagePerformance: 0,
        totalQuestions: 0,
        totalObjections: 0,
        successRate: 0,
        topicDistribution: [],
        sentimentTrend: [],
        performanceTrend: [],
        engagementTrend: []
      };
    }

    const totalCalls = callRecords.length;
    const totalDurationSeconds = callRecords.reduce((sum, call) => sum + (call.duration || 0), 0);
    const averageDuration = totalCalls > 0 ? totalDurationSeconds / totalCalls : 0; // seconds
    
    const averageSatisfaction = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.metrics?.customerSatisfaction || 0), 0) / recordsWithAnalysis.length;
    
    const averageEngagement = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.customerEngagement || 0), 0) / recordsWithAnalysis.length;
    
    const averagePerformance = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.agentPerformance || 0), 0) / recordsWithAnalysis.length;

    const totalQuestions = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.metrics?.questionCount || 0), 0);
    
    const totalObjections = recordsWithAnalysis.reduce((sum, call) => 
      sum + (call.callAnalysis?.metrics?.objectionCount || 0), 0);

    const successRate = callRecords.filter(call => call.outcome === 'successful').length / totalCalls;

    // Topic distribution
    const topicCounts: { [key: string]: number } = {};
    recordsWithAnalysis.forEach(call => {
      call.callAnalysis?.keyTopics?.forEach(topic => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    });
    const topicDistribution = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count);

    // Sentiment trend over time
    const sentimentTrend = callRecords
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(call => ({
        date: new Date(call.timestamp).toLocaleDateString(),
        sentiment: call.sentiment,
        mood: call.mood
      }));

    // Performance trend
    const performanceTrend = recordsWithAnalysis
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(call => ({
        date: new Date(call.timestamp).toLocaleDateString(),
        performance: call.callAnalysis?.agentPerformance || 0,
        engagement: call.callAnalysis?.customerEngagement || 0
      }));

    // Format duration for display
    const formatDuration = (seconds: number) => {
      if (seconds < 60) {
        return `${Math.round(seconds)}s`;
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
      } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
    };

    return {
      totalCalls,
      averageDuration: formatDuration(averageDuration),
      averageSatisfaction: Math.round(averageSatisfaction * 100) / 100,
      averageEngagement: Math.round(averageEngagement * 100) / 100,
      averagePerformance: Math.round(averagePerformance * 100) / 100,
      totalQuestions,
      totalObjections,
      successRate: Math.round(successRate * 100),
      topicDistribution,
      sentimentTrend,
      performanceTrend,
      engagementTrend: performanceTrend
    };
  };

  const metrics = calculateMetrics();

  // Chart components
  const SentimentTrendChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
      <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
        <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
        Sentiment Trend Over Time
      </h3>
      
      {/* Sentiment Context Legend - Improved Layout */}
      <div className="mb-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Sentiment Scale</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <div>
              <span className="text-green-700 font-semibold text-sm">Positive (0.3+)</span>
              <p className="text-xs text-slate-600">Customer engaged, satisfied</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-yellow-200">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <div>
              <span className="text-yellow-700 font-semibold text-sm">Neutral (-0.3 to 0.3)</span>
              <p className="text-xs text-slate-600">Standard interaction</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-red-200">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <div>
              <span className="text-red-700 font-semibold text-sm">Negative (-0.3-)</span>
              <p className="text-xs text-slate-600">Customer frustrated, needs attention</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Area - Much Larger */}
      <div className="h-80 flex items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
        <div className="text-center">
          <LineChart className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h4 className="text-lg font-semibold text-slate-600 mb-2">Sentiment Trend Chart</h4>
          <p className="text-slate-500 mb-6">Interactive chart will be displayed here</p>
          
          {/* Recent Sentiment Data - Better Layout */}
          {metrics.sentimentTrend.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200 max-w-md mx-auto">
              <h5 className="text-sm font-semibold text-slate-700 mb-3">Recent Sentiment Data</h5>
              <div className="space-y-3">
                {metrics.sentimentTrend.slice(-5).map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-700">{point.date}</span>
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        point.sentiment > 0.3 ? 'bg-green-500' :
                        point.sentiment < -0.3 ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className="text-sm font-semibold text-slate-600">
                        {point.sentiment > 0 ? '+' : ''}{point.sentiment.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const TopicDistributionChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <PieChart className="w-5 h-5 mr-2 text-green-600" />
        Discussion Topics
      </h3>
      <div className="space-y-3">
        {metrics.topicDistribution.slice(0, 8).map((topic, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-slate-700 capitalize">{topic.topic}</span>
            <div className="flex items-center space-x-2">
              <div className="w-24 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(topic.count / (metrics.topicDistribution[0]?.count || 1)) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm text-slate-500 w-8">{topic.count}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PerformanceMetricsChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <Target className="w-5 h-5 mr-2 text-purple-600" />
        Performance Metrics
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {metrics.averagePerformance}%
          </div>
          <div className="text-sm text-slate-500">Agent Performance</div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className="bg-purple-500 h-2 rounded-full" 
              style={{ width: `${metrics.averagePerformance}%` }}
            ></div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {metrics.averageEngagement}%
          </div>
          <div className="text-sm text-slate-500">Customer Engagement</div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-500 h-2 rounded-full" 
              style={{ width: `${metrics.averageEngagement * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const CallDurationChart = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-orange-600" />
        Call Duration Analysis
      </h3>
      <div className="space-y-4">
        {callRecords.slice(0, 10).map((call, index) => (
          <div key={call._id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                call.direction === 'inbound' ? 'bg-green-400' : 'bg-blue-400'
              }`}></div>
              <span className="text-sm text-slate-600">
                {new Date(call.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: `${Math.min((call.duration / 60) / 10 * 100, 100)}%` }}
                ></div>
              </div>
              <span className="text-sm text-slate-600 w-12">
                {Math.round(call.duration / 60)}m
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ConversationFlowChart = ({ call }: { call: CallRecord }) => {
    if (!call.callAnalysis?.conversationFlow?.segments) return null;
    
    const segments = call.callAnalysis.conversationFlow.segments.slice(0, 10);
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
          Conversation Flow - {new Date(call.timestamp).toLocaleDateString()}
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {segments.map((segment, index) => {
            const isCustomer = segment.speaker === 'customer';
            const sentimentColor = segment.sentiment > 0.3 ? 'bg-green-100 border-green-300' :
                                 segment.sentiment < -0.3 ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300';
            
            return (
              <div key={index} className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg border ${sentimentColor}`}>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700 capitalize">
                      {segment.speaker}
                    </span>
                    <span className="text-xs text-slate-500">
                      {Math.round(segment.timestamp / 60)}:{(segment.timestamp % 60).toString().padStart(2, '0')}
                    </span>
                    {segment.topic && (
                      <span className="px-1 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                        {segment.topic}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800">{segment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Client Metrics Dashboard</h1>
            <p className="text-slate-600">Comprehensive analytics for client call performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Calls</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.totalCalls}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Duration</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.averageDuration}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Success Rate</p>
              <p className="text-3xl font-bold text-slate-900">{metrics.successRate}%</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Avg Satisfaction</p>
              <p className="text-3xl font-bold text-slate-900">
                {Math.round(metrics.averageSatisfaction * 100)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <SentimentTrendChart />
        <TopicDistributionChart />
        <PerformanceMetricsChart />
        <CallDurationChart />
      </div>

      {/* Individual Call Analysis */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Individual Call Analysis</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {callRecords.slice(0, 4).map((call) => (
            <div key={call._id} className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {new Date(call.timestamp).toLocaleDateString()}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {call.direction} • {Math.round(call.duration / 60)}m • {call.mood}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCall(selectedCall?._id === call._id ? null : call)}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  {selectedCall?._id === call._id ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {call.callAnalysis && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-sm text-slate-500 mb-1">Engagement</div>
                      <div className="text-lg font-semibold text-slate-900">
                        {Math.round((call.callAnalysis.customerEngagement || 0) * 100)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-slate-500 mb-1">Performance</div>
                      <div className="text-lg font-semibold text-slate-900">
                        {Math.round((call.callAnalysis.agentPerformance || 0) * 100)}%
                      </div>
                    </div>
                  </div>

                  {call.callAnalysis.summary && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <p className="text-sm text-slate-700">{call.callAnalysis.summary}</p>
                    </div>
                  )}

                  {selectedCall?._id === call._id && (
                    <ConversationFlowChart call={call} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
