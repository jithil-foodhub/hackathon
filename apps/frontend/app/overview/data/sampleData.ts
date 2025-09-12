import { OverviewData } from '../types/overview';

export const sampleOverviewData: OverviewData = {
  quickStats: {
    totalCalls: 247,
    activeClients: 89,
    avgSentiment: 0.76,
    performance: 92
  },

  callAnalysis: {
    totalDuration: 18420, // in minutes
    averageDuration: 74.6, // in minutes
    successRate: 89.2,
    conversionRate: 23.5,
    topIssues: [
      { issue: "Order Processing", count: 34, severity: 'high' },
      { issue: "Payment Issues", count: 28, severity: 'medium' },
      { issue: "Product Inquiry", count: 45, severity: 'low' },
      { issue: "Technical Support", count: 19, severity: 'high' },
      { issue: "Billing Questions", count: 22, severity: 'medium' }
    ],
    callTrends: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      calls: Math.floor(Math.random() * 20) + 5,
      success: Math.floor(Math.random() * 15) + 3
    }))
  },

  sentiment: {
    overall: 0.73,
    distribution: {
      positive: 62,
      neutral: 28,
      negative: 10
    },
    trends: Array.from({ length: 7 }, (_, i) => ({
      time: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sentiment: 0.6 + Math.random() * 0.3,
      volume: Math.floor(Math.random() * 50) + 20
    })),
    emotionalInsights: [
      { emotion: "Satisfaction", percentage: 45, color: "#10B981" },
      { emotion: "Excitement", percentage: 18, color: "#F59E0B" },
      { emotion: "Neutral", percentage: 25, color: "#6B7280" },
      { emotion: "Frustration", percentage: 8, color: "#EF4444" },
      { emotion: "Confusion", percentage: 4, color: "#8B5CF6" }
    ]
  },

  metrics: {
    callVolume: {
      today: 247,
      yesterday: 198,
      growth: 24.7
    },
    responseTime: {
      average: 12.4,
      target: 15.0,
      performance: 117.7
    },
    customerSatisfaction: {
      score: 4.6,
      target: 4.5,
      trend: 'up'
    },
    conversionMetrics: {
      leads: 89,
      conversions: 21,
      rate: 23.6,
      revenue: 45670
    }
  },

  aiSuggestions: {
    suggestions: [
      {
        id: '1',
        type: 'sales',
        priority: 'high',
        title: 'Optimize upselling opportunities',
        description: 'Customers show 34% higher engagement when product recommendations are made in the first 2 minutes of the call.',
        impact: 'Potential 15% increase in revenue',
        confidence: 0.87,
        tags: ['upselling', 'timing', 'engagement'],
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        type: 'tone',
        priority: 'medium',
        title: 'Adjust conversation pace',
        description: 'Calls with slower speaking pace show 22% higher customer satisfaction scores.',
        impact: 'Improved customer experience',
        confidence: 0.73,
        tags: ['pace', 'satisfaction', 'communication'],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'product',
        priority: 'critical',
        title: 'Address menu customization requests',
        description: 'Menu customization is mentioned in 67% of negative sentiment calls. Consider highlighting this feature.',
        impact: 'Reduce negative sentiment by 25%',
        confidence: 0.91,
        tags: ['menu', 'customization', 'feature-highlight'],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'process',
        priority: 'medium',
        title: 'Streamline onboarding flow',
        description: 'New clients taking longer than 5 minutes to understand the platform show 40% higher churn rates.',
        impact: 'Reduce churn by 18%',
        confidence: 0.82,
        tags: ['onboarding', 'churn', 'training'],
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ],
    insights: [
      {
        category: 'Customer Behavior',
        insight: 'Peak call times correlate with lunch hours (11 AM - 2 PM)',
        actionable: true,
        impact: 'high'
      },
      {
        category: 'Product Interest',
        insight: 'Mobile ordering features mentioned 3x more than web features',
        actionable: true,
        impact: 'medium'
      },
      {
        category: 'Support Patterns',
        insight: 'Technical issues spike on Monday mornings',
        actionable: false,
        impact: 'low'
      }
    ],
    trendingTopics: [
      { topic: 'Mobile App', mentions: 156, sentiment: 0.78, growth: 34.2 },
      { topic: 'Delivery Integration', mentions: 134, sentiment: 0.82, growth: 28.5 },
      { topic: 'POS System', mentions: 98, sentiment: 0.71, growth: 12.3 },
      { topic: 'Menu Management', mentions: 87, sentiment: 0.69, growth: -5.2 },
      { topic: 'Customer Support', mentions: 76, sentiment: 0.65, growth: 18.7 }
    ]
  },

  performance: {
    kpis: [
      {
        name: 'Call Resolution Rate',
        value: 94.2,
        target: 90.0,
        unit: '%',
        trend: 2.1,
        status: 'good'
      },
      {
        name: 'Average Handle Time',
        value: 8.4,
        target: 10.0,
        unit: 'min',
        trend: -0.8,
        status: 'good'
      },
      {
        name: 'First Call Resolution',
        value: 78.6,
        target: 80.0,
        unit: '%',
        trend: -1.2,
        status: 'warning'
      },
      {
        name: 'Customer Satisfaction',
        value: 4.6,
        target: 4.5,
        unit: '/5',
        trend: 0.3,
        status: 'good'
      }
    ],
    agentPerformance: [
      {
        agentId: 'agent-001',
        name: 'Sarah Johnson',
        callsHandled: 43,
        avgDuration: 7.2,
        satisfactionScore: 4.8,
        conversionRate: 28.5
      },
      {
        agentId: 'agent-002',
        name: 'Mike Chen',
        callsHandled: 38,
        avgDuration: 8.1,
        satisfactionScore: 4.6,
        conversionRate: 24.1
      },
      {
        agentId: 'agent-003',
        name: 'Emily Rodriguez',
        callsHandled: 41,
        avgDuration: 6.9,
        satisfactionScore: 4.9,
        conversionRate: 31.2
      }
    ],
    timeBasedMetrics: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      calls: Math.floor(Math.random() * 25) + 5,
      avgDuration: 6 + Math.random() * 4,
      satisfaction: 4.2 + Math.random() * 0.6
    }))
  },

  trends: {
    callVolumeTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      calls: Math.floor(Math.random() * 100) + 150,
      answered: Math.floor(Math.random() * 80) + 120,
      missed: Math.floor(Math.random() * 20) + 5
    })),
    sentimentTrend: Array.from({ length: 14 }, (_, i) => ({
      date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sentiment: 0.6 + Math.random() * 0.3,
      volume: Math.floor(Math.random() * 50) + 20
    })),
    performanceTrend: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      metric: 'Overall Performance',
      value: 85 + Math.random() * 10
    })),
    topicTrends: [
      {
        topic: 'Mobile App',
        timeline: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          mentions: Math.floor(Math.random() * 30) + 10
        }))
      },
      {
        topic: 'Delivery',
        timeline: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          mentions: Math.floor(Math.random() * 25) + 8
        }))
      }
    ]
  },

  recentCalls: [
    {
      id: 'call-001',
      clientId: 'client-123',
      clientPhone: '+1234567890',
      clientName: 'Pizza Palace',
      duration: 12.5,
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      status: 'completed',
      sentiment: 0.85,
      summary: 'Customer interested in mobile ordering integration. Discussed pricing and implementation timeline.',
      tags: ['mobile-ordering', 'integration', 'pricing'],
      agentId: 'agent-001',
      outcome: 'lead'
    },
    {
      id: 'call-002',
      clientId: 'client-456',
      clientPhone: '+1987654321',
      clientName: 'Burger Barn',
      duration: 8.2,
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      status: 'completed',
      sentiment: 0.62,
      summary: 'Technical support call regarding POS system connectivity issues. Resolved through remote assistance.',
      tags: ['technical-support', 'pos-system', 'resolved'],
      agentId: 'agent-002',
      outcome: 'support'
    },
    {
      id: 'call-003',
      clientId: 'client-789',
      clientPhone: '+1122334455',
      clientName: 'Taco Town',
      duration: 18.7,
      timestamp: new Date(Date.now() - 47 * 60 * 1000).toISOString(),
      status: 'completed',
      sentiment: 0.91,
      summary: 'Successful conversion call. Customer signed up for premium plan with full feature set.',
      tags: ['conversion', 'premium-plan', 'success'],
      agentId: 'agent-003',
      outcome: 'sale'
    },
    {
      id: 'call-004',
      clientId: 'client-101',
      clientPhone: '+1555666777',
      clientName: 'Cafe Corner',
      duration: 6.1,
      timestamp: new Date(Date.now() - 68 * 60 * 1000).toISOString(),
      status: 'completed',
      sentiment: 0.45,
      summary: 'Customer complained about app performance issues. Escalated to technical team for investigation.',
      tags: ['complaint', 'app-performance', 'escalated'],
      agentId: 'agent-001',
      outcome: 'support'
    },
    {
      id: 'call-005',
      clientId: 'client-202',
      clientPhone: '+1888999000',
      clientName: 'Noodle House',
      duration: 14.3,
      timestamp: new Date(Date.now() - 89 * 60 * 1000).toISOString(),
      status: 'completed',
      sentiment: 0.78,
      summary: 'Follow-up call on implementation. Customer satisfied with progress and requested additional features.',
      tags: ['follow-up', 'implementation', 'additional-features'],
      agentId: 'agent-002',
      outcome: 'other'
    }
  ],

  lastUpdated: new Date().toISOString()
};