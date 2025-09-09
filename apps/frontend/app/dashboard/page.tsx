"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Phone,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    activeClients: 0,
    conversionRate: 0,
    avgCallDuration: 0,
  });

  const [recentCalls, setRecentCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, callsRes] = await Promise.all([
        fetch("/api/clients/stats"),
        fetch("/api/clients?limit=5"),
      ]);

      const statsData = await statsRes.json();
      const callsData = await callsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (callsData.success) {
        setRecentCalls(callsData.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout currentScreen="home">
        <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentScreen="home">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Sales Dashboard
            </h1>
            <p className="text-xl text-slate-600">
              Overview of your AI sales performance
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Total Calls
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.totalCalls}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Active Clients
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.activeClients}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Conversion Rate
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.conversionRate}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Avg Duration
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.avgCallDuration}m
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Recent Calls
              </h3>
              <div className="space-y-4">
                {recentCalls.length > 0 ? (
                  recentCalls.map((call, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {call.phoneNumber}
                          </p>
                          <p className="text-sm text-slate-600">
                            {call.status}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">
                        {new Date(call.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Phone className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">No recent calls</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                System Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">AI Service</span>
                  </div>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">Transcription</span>
                  </div>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-slate-700">WebSocket</span>
                  </div>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
