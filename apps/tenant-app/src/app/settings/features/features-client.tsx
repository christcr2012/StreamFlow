// apps/tenant-app/src/app/settings/features/features-client.tsx
// Feature flags management UI - Phase 1

'use client';

import { useState, useEffect } from 'react';
import {
  Flag,
  Plus,
  Search,
  Users,
  TrendingUp,
  Zap,
  Package,
  BarChart3,
  Clock,
  Shield,
  ChevronRight,
} from 'lucide-react';

interface FeaturesClientProps {
  orgId: string;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  enabledForUsers: string[];
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

const categoryConfig = {
  ai: { icon: Zap, color: 'purple', label: 'AI Features' },
  customer: { icon: Users, color: 'blue', label: 'Customer Features' },
  analytics: { icon: BarChart3, color: 'green', label: 'Analytics' },
  time_tracking: { icon: Clock, color: 'orange', label: 'Time Tracking' },
  operations: { icon: Package, color: 'indigo', label: 'Operations' },
  security: { icon: Shield, color: 'red', label: 'Security' },
};

export function FeaturesClient({ orgId }: FeaturesClientProps) {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFeatureFlags();
  }, [categoryFilter, statusFilter]);

  async function fetchFeatureFlags() {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (statusFilter === 'enabled') params.append('enabled', 'true');
      if (statusFilter === 'disabled') params.append('enabled', 'false');

      const res = await fetch(`/api/features?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFeatureFlags(data.featureFlags || []);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeature(flagId: string, currentEnabled: boolean) {
    try {
      const res = await fetch('/api/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: flagId,
          enabled: !currentEnabled,
        }),
      });

      if (res.ok) {
        // Optimistically update UI
        setFeatureFlags((prev) =>
          prev.map((flag) =>
            flag.id === flagId
              ? { ...flag, enabled: !currentEnabled, updatedAt: new Date().toISOString() }
              : flag
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  }

  const filteredFlags = featureFlags.filter((flag) =>
    flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flag.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = featureFlags.filter((f) => f.enabled).length;
  const rolloutFlags = featureFlags.filter((f) => f.rolloutPercentage < 100 && f.rolloutPercentage > 0);
  const userSpecificFlags = featureFlags.filter((f) => f.enabledForUsers.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading feature flags...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
              <p className="text-gray-600 mt-1">
                Manage feature toggles, A/B testing, and gradual rollouts
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Feature Flag
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            label="Total Flags"
            value={featureFlags.length.toString()}
            icon={Flag}
            color="blue"
          />
          <StatsCard
            label="Enabled"
            value={enabledCount.toString()}
            icon={Zap}
            color="green"
          />
          <StatsCard
            label="Gradual Rollout"
            value={rolloutFlags.length.toString()}
            icon={TrendingUp}
            color="purple"
          />
          <StatsCard
            label="User-Specific"
            value={userSpecificFlags.length.toString()}
            icon={Users}
            color="orange"
          />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search feature flags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="ai">AI Features</option>
              <option value="customer">Customer Features</option>
              <option value="analytics">Analytics</option>
              <option value="time_tracking">Time Tracking</option>
              <option value="operations">Operations</option>
              <option value="security">Security</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>

        {/* Feature Flags List */}
        <div className="space-y-4">
          {filteredFlags.length === 0 ? (
            <div className="bg-white rounded-lg border p-12 text-center">
              <Flag className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No feature flags found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your filters or create a new feature flag
              </p>
            </div>
          ) : (
            filteredFlags.map((flag) => {
              const config = categoryConfig[flag.category as keyof typeof categoryConfig];
              const CategoryIcon = config?.icon || Flag;

              return (
                <div
                  key={flag.id}
                  className="bg-white rounded-lg border hover:border-gray-300 transition-colors"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`p-2 rounded-lg ${
                              config?.color === 'purple'
                                ? 'bg-purple-100 text-purple-600'
                                : config?.color === 'blue'
                                ? 'bg-blue-100 text-blue-600'
                                : config?.color === 'green'
                                ? 'bg-green-100 text-green-600'
                                : config?.color === 'orange'
                                ? 'bg-orange-100 text-orange-600'
                                : config?.color === 'indigo'
                                ? 'bg-indigo-100 text-indigo-600'
                                : config?.color === 'red'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <CategoryIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{flag.name}</h3>
                            <p className="text-sm text-gray-500">{flag.key}</p>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">{flag.description}</p>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Flag className="w-4 h-4" />
                            {config?.label || flag.category}
                          </span>
                          {flag.rolloutPercentage < 100 && (
                            <span className="flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4" />
                              {flag.rolloutPercentage}% rollout
                            </span>
                          )}
                          {flag.enabledForUsers.length > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Users className="w-4 h-4" />
                              {flag.enabledForUsers.length} specific users
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            Updated {new Date(flag.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className="flex items-center gap-4 ml-4">
                        <button
                          onClick={() => toggleFeature(flag.id, flag.enabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            flag.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              flag.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Phase 1 Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Flag className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Phase 1: Stub Implementation</p>
              <p>
                Feature flags showing example data. Toggle switches update local state. Phase 2
                will integrate with ProviderConfig.featureFlags JSON field and implement full A/B
                testing framework with analytics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
