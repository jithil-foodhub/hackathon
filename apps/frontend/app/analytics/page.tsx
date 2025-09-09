"use client";

import React from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Phone,
  Clock,
  CheckCircle,
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

export default function AnalyticsPage() {
  return (
    <AppLayout currentScreen="analytics">
      <div className="p-8 bg-gradient-to-br from-slate-50 to-blue-50 h-full">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-xl text-slate-600">
              Comprehensive insights into your sales performance
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
                  <p className="text-3xl font-bold text-slate-900">1,247</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">
                  +12.5%
                </span>
                <span className="text-sm text-slate-500 ml-1">
                  vs last month
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Conversion Rate
                  </p>
                  <p className="text-3xl font-bold text-slate-900">23.4%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">
                  +3.2%
                </span>
                <span className="text-sm text-slate-500 ml-1">
                  vs last month
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Avg Call Duration
                  </p>
                  <p className="text-3xl font-bold text-slate-900">4m 32s</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+45s</span>
                <span className="text-sm text-slate-500 ml-1">
                  vs last month
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Active Clients
                  </p>
                  <p className="text-3xl font-bold text-slate-900">89</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+8</span>
                <span className="text-sm text-slate-500 ml-1">
                  vs last month
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Call Volume Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Call Volume Trends
              </h3>
              <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-500">
                    Chart visualization would go here
                  </p>
                </div>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Conversion Funnel
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    Total Calls
                  </span>
                  <span className="text-sm font-bold text-blue-600">1,247</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    Qualified Leads
                  </span>
                  <span className="text-sm font-bold text-green-600">456</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    Demos Scheduled
                  </span>
                  <span className="text-sm font-bold text-purple-600">123</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    Deals Closed
                  </span>
                  <span className="text-sm font-bold text-orange-600">29</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
