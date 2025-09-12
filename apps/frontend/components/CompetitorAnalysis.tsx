'use client';

import { CheckCircle, XCircle, Trophy, Target } from 'lucide-react';

interface CompetitorContainer {
  competitor_name: string;
  has: string[];
  does_not_have: string[];
  why_choose_foodhub: string[];
}

interface CompetitorAnalysisProps {
  competitorData: CompetitorContainer;
  className?: string;
}

export function CompetitorAnalysis({ competitorData, className = '' }: CompetitorAnalysisProps) {
  return (
    <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center mb-4">
        <Trophy className="w-5 h-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-bold text-blue-800">
          FoodHub vs {competitorData.competitor_name}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* What Competitor Has */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center mb-3">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-800">
              {competitorData.competitor_name} Has
            </h4>
          </div>
          <ul className="space-y-2">
            {competitorData.has.map((item, index) => (
              <li key={index} className="flex items-start text-xs text-gray-600">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What Competitor Doesn't Have */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center mb-3">
            <XCircle className="w-4 h-4 text-red-600 mr-2" />
            <h4 className="text-sm font-semibold text-gray-800">
              {competitorData.competitor_name} Lacks
            </h4>
          </div>
          <ul className="space-y-2">
            {competitorData.does_not_have.map((item, index) => (
              <li key={index} className="flex items-start text-xs text-gray-600">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Why Choose FoodHub */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
          <div className="flex items-center mb-3">
            <Target className="w-4 h-4 text-green-700 mr-2" />
            <h4 className="text-sm font-semibold text-green-800">
              Why Choose FoodHub
            </h4>
          </div>
          <ul className="space-y-2">
            {competitorData.why_choose_foodhub.map((item, index) => (
              <li key={index} className="flex items-start text-xs text-green-700 font-medium">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
        <p className="text-sm text-blue-800 font-medium text-center">
          💡 <strong>Agent Tip:</strong> Emphasize FoodHub's complete ecosystem advantage - 
          we're not just a marketplace or just a POS, we're the complete solution.
        </p>
      </div>
    </div>
  );
}