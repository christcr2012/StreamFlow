// AI Insights Component
// Shows intelligent analysis, trends, and opportunities from AI processing

import { useState, useEffect } from 'react';

interface InsightData {
  leadQualityTrend: 'improving' | 'declining' | 'stable';
  avgQualityScore: number;
  hotOpportunities: Array<{
    id: string;
    title: string;
    urgency: 'immediate' | 'high' | 'medium';
    value: string;
    action: string;
  }>;
  marketInsights: Array<{
    category: string;
    insight: string;
    confidence: number;
  }>;
  recentAnalysis: Array<{
    feature: string;
    timestamp: string;
    result: string;
  }>;
}

export default function AiInsights() {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, show demo insights that will be replaced with real AI data
    setTimeout(() => {
      setInsights({
        leadQualityTrend: 'improving',
        avgQualityScore: 78,
        hotOpportunities: [
          {
            id: '1',
            title: 'VA Medical Center Janitorial Services',
            urgency: 'immediate',
            value: '$750K',
            action: 'Submit proposal within 2 hours'
          },
          {
            id: '2', 
            title: 'Denver Federal Building Maintenance',
            urgency: 'high',
            value: '$420K',
            action: 'Request clarification meeting'
          },
          {
            id: '3',
            title: 'Greeley Municipal Complex Cleaning',
            urgency: 'medium',
            value: '$180K',
            action: 'Prepare competitive analysis'
          }
        ],
        marketInsights: [
          {
            category: 'Pricing Trends',
            insight: 'Healthcare facilities showing 15% increase in cleaning budgets',
            confidence: 92
          },
          {
            category: 'Competition',
            insight: 'Low competitor density in Northern Colorado federal contracts',
            confidence: 87
          },
          {
            category: 'Seasonal Patterns',
            insight: 'Q1 shows highest RFP volume for government contracts',
            confidence: 95
          }
        ],
        recentAnalysis: [
          {
            feature: 'RFP Strategy',
            timestamp: '2 hours ago',
            result: 'High win probability (78%) for healthcare RFP'
          },
          {
            feature: 'Pricing Intelligence',
            timestamp: '4 hours ago', 
            result: 'Optimal range: $0.12-0.18/sq ft for federal contracts'
          },
          {
            feature: 'Lead Analysis',
            timestamp: '6 hours ago',
            result: '3 hot leads identified requiring immediate action'
          }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const getTrendIcon = () => {
    switch (insights.leadQualityTrend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = () => {
    switch (insights.leadQualityTrend) {
      case 'improving': return 'text-green-700';
      case 'declining': return 'text-red-700';
      default: return 'text-gray-700';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"></div>
        <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
          Live Analysis
        </span>
      </div>

      {/* Lead Quality Trend */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Lead Quality Trend</h4>
          <span className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()} {insights.leadQualityTrend}
          </span>
        </div>
        <div className="bg-white/60 rounded-lg p-4 border border-white/80">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{insights.avgQualityScore}</div>
              <div className="text-sm text-gray-600">Average Quality Score</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  d="M18 2.0845 A 15.9155 15.9155 0 0 1 18 33.9155 A 15.9155 15.9155 0 0 1 18 2.0845"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  className="text-green-500"
                  d="M18 2.0845 A 15.9155 15.9155 0 0 1 18 33.9155 A 15.9155 15.9155 0 0 1 18 2.0845"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${insights.avgQualityScore}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900">
                {insights.avgQualityScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hot Opportunities */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Hot Opportunities</h4>
        <div className="space-y-3">
          {insights.hotOpportunities.slice(0, 3).map((opp) => (
            <div key={opp.id} className="bg-white/60 rounded-lg p-3 border border-white/80">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 text-sm">{opp.title}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getUrgencyColor(opp.urgency)}`}>
                      {opp.urgency}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{opp.action}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-700">{opp.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Insights */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Market Intelligence</h4>
        <div className="space-y-2">
          {insights.marketInsights.slice(0, 2).map((insight, index) => (
            <div key={index} className="bg-white/60 rounded-lg p-3 border border-white/80">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 mb-1">{insight.category}</div>
                  <div className="text-xs text-gray-700">{insight.insight}</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-gray-600">{insight.confidence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Analysis */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Recent AI Analysis</h4>
        <div className="space-y-2">
          {insights.recentAnalysis.map((analysis, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="font-medium text-gray-900">{analysis.feature}</span>
                <span className="text-gray-500">{analysis.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}