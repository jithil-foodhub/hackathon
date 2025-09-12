// Core data types for the overview dashboard

export interface QuickStats {
  totalCalls: number;
  activeClients: number;
  avgSentiment: number;
  performance: number;
}

export interface CallAnalysisSummary {
  totalDuration: number;
  averageDuration: number;
  successRate: number;
  conversionRate: number;
  topIssues: Array<{
    issue: string;
    count: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  callTrends: Array<{
    time: string;
    calls: number;
    success: number;
  }>;
}

export interface SentimentData {
  overall: number;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trends: Array<{
    time: string;
    sentiment: number;
    volume: number;
  }>;
  emotionalInsights: Array<{
    emotion: string;
    percentage: number;
    color: string;
  }>;
}

export interface MetricsData {
  callVolume: {
    today: number;
    yesterday: number;
    growth: number;
  };
  responseTime: {
    average: number;
    target: number;
    performance: number;
  };
  customerSatisfaction: {
    score: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  };
  conversionMetrics: {
    leads: number;
    conversions: number;
    rate: number;
    revenue: number;
  };
}

export interface AISparklingData {
  suggestions: Array<{
    id: string;
    type: 'product' | 'sales' | 'tone' | 'process' | 'technical';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    confidence: number;
    tags: string[];
    createdAt: string;
  }>;
  insights: Array<{
    category: string;
    insight: string;
    actionable: boolean;
    impact: 'low' | 'medium' | 'high';
  }>;
  trendingTopics: Array<{
    topic: string;
    mentions: number;
    sentiment: number;
    growth: number;
  }>;
}

export interface PerformanceMetrics {
  kpis: Array<{
    name: string;
    value: number;
    target: number;
    unit: string;
    trend: number;
    status: 'good' | 'warning' | 'critical';
  }>;
  agentPerformance: Array<{
    agentId: string;
    name: string;
    callsHandled: number;
    avgDuration: number;
    satisfactionScore: number;
    conversionRate: number;
  }>;
  timeBasedMetrics: Array<{
    hour: number;
    calls: number;
    avgDuration: number;
    satisfaction: number;
  }>;
}

export interface TrendData {
  callVolumeTrend: Array<{
    date: string;
    calls: number;
    answered: number;
    missed: number;
  }>;
  sentimentTrend: Array<{
    date: string;
    sentiment: number;
    volume: number;
  }>;
  performanceTrend: Array<{
    date: string;
    metric: string;
    value: number;
  }>;
  topicTrends: Array<{
    topic: string;
    timeline: Array<{
      date: string;
      mentions: number;
    }>;
  }>;
}

export interface RecentCall {
  id: string;
  clientId: string;
  clientPhone: string;
  clientName?: string;
  duration: number;
  timestamp: string;
  status: 'completed' | 'missed' | 'ongoing';
  sentiment: number;
  summary: string;
  tags: string[];
  agentId?: string;
  outcome: 'lead' | 'sale' | 'support' | 'other';
}

export interface OverviewData {
  quickStats: QuickStats;
  callAnalysis: CallAnalysisSummary;
  sentiment: SentimentData;
  metrics: MetricsData;
  aiSuggestions: AISparklingData;
  performance: PerformanceMetrics;
  trends: TrendData;
  recentCalls: RecentCall[];
  lastUpdated: string;
}

// Layout and configuration types
export type LayoutType = 'default' | 'compact' | 'analytics';

export interface WidgetConfig {
  id: string;
  size: string;
  priority: number;
}

export interface LayoutConfig {
  gridCols: string;
  widgets: WidgetConfig[];
}

// Component prop types
export interface BaseWidgetProps {
  data: OverviewData;
  isLoading: boolean;
  error: string | null;
  className?: string;
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'donut';
  data: ChartDataPoint[];
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  height?: number;
}

// Error handling types
export interface WidgetError {
  code: string;
  message: string;
  details?: any;
}

export interface SafeData<T> {
  data: T | null;
  error: WidgetError | null;
  isLoading: boolean;
}