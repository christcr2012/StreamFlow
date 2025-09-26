// AI Control Center Component
// Premium dashboard component showing usage, status, and upgrade options

import { useState, useEffect } from 'react';
import { useMe } from '@/lib/useMe';

interface AiUsageData {
  creditsRemaining: number;
  creditsUsedThisMonth: number;
  monthlyBudgetCredits: number;
  percentUsed: number;
  plan: 'BASE' | 'PRO' | 'ELITE';
  alerts: {
    warning: boolean;
    critical: boolean;
    exhausted: boolean;
  };
  features: any;
  upgradeRecommendation?: {
    suggested: string;
    reason: string;
    benefits: string[];
    urgency: string;
  };
}

export default function AiControlCenter() {
  const [usage, setUsage] = useState<AiUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { me } = useMe();

  useEffect(() => {
    fetchUsage();
    // Refresh every 30 seconds for live monitoring
    const interval = setInterval(fetchUsage, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchUsage() {
    try {
      const response = await fetch('/api/ai/usage');
      const data = await response.json();
      
      if (data.success) {
        setUsage(data.usage);
        setError(null);
      } else {
        setError(data.error || 'Failed to load usage data');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">AI Control Center</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchUsage}
          className="mt-2 text-sm text-red-700 underline hover:text-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!usage) return null;

  const getStatusColor = () => {
    if (usage.alerts.exhausted) return 'bg-red-500';
    if (usage.alerts.critical) return 'bg-orange-500';
    if (usage.alerts.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (usage.alerts.exhausted) return 'Exhausted';
    if (usage.alerts.critical) return 'Critical';
    if (usage.alerts.warning) return 'Warning';
    return 'Healthy';
  };

  const getPlanBadgeColor = () => {
    switch (usage.plan) {
      case 'ELITE': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PRO': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <h3 className="text-lg font-semibold text-gray-900">AI Control Center</h3>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPlanBadgeColor()}`}>
            {usage.plan}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
          <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
        </div>
      </div>

      {/* Usage Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Provider Cost Usage</span>
          <span className="text-sm text-gray-500">
            {usage.creditsUsedThisMonth.toLocaleString()} / {usage.monthlyBudgetCredits.toLocaleString()} credits
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ${
              usage.alerts.exhausted ? 'bg-red-500' :
              usage.alerts.critical ? 'bg-orange-500' :
              usage.alerts.warning ? 'bg-yellow-500' :
              'bg-gradient-to-r from-green-500 to-blue-500'
            }`}
            style={{ width: `${Math.min(100, usage.percentUsed)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span className="font-medium">{usage.percentUsed}% used</span>
          <span>100%</span>
        </div>
      </div>

      {/* Credit Balance */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white/60 rounded-lg p-3 border border-white/80">
          <div className="text-2xl font-bold text-gray-900">
            {usage.creditsRemaining.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Client Credits Available</div>
        </div>
        <div className="bg-white/60 rounded-lg p-3 border border-white/80">
          <div className="text-2xl font-bold text-gray-900">
            {Math.max(0, usage.monthlyBudgetCredits - usage.creditsUsedThisMonth).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Provider Budget Left</div>
        </div>
      </div>

      {/* Upgrade Recommendation */}
      {usage.upgradeRecommendation && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">{usage.upgradeRecommendation.suggested} Plan Recommended</h4>
              <p className="text-sm text-indigo-100 mt-1">{usage.upgradeRecommendation.reason}</p>
            </div>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button 
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-left transition-colors"
          disabled={usage.alerts.exhausted}
        >
          <div className="text-sm font-medium text-gray-900">Add Credits</div>
          <div className="text-xs text-gray-500">Top up your balance</div>
        </button>
        <button 
          className="bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 text-left transition-colors"
        >
          <div className="text-sm font-medium text-gray-900">Usage Report</div>
          <div className="text-xs text-gray-500">Detailed analytics</div>
        </button>
      </div>
    </div>
  );
}