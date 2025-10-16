/**
 * Cleaning Analytics Dashboard
 * 
 * Analytics and reporting for cleaning vertical
 */

'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  revenue: {
    thisMonth: number;
    lastMonth: number;
    thisYear: number;
  };
  workOrders: {
    completed: number;
    scheduled: number;
    inProgress: number;
    cancelled: number;
  };
  quality: {
    averageScore: number;
    totalInspections: number;
    defectsCount: number;
  };
  contracts: {
    active: number;
    paused: number;
    cancelled: number;
  };
}

export default function CleaningAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // TODO: Create dedicated analytics API endpoint
      // For now, fetch from multiple endpoints and aggregate
      const [invoicesRes, workOrdersRes, inspectionsRes, contractsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/cleaning/work-orders'),
        fetch('/api/cleaning/inspections'),
        fetch('/api/cleaning/contracts')
      ]);

      const invoices = await invoicesRes.json();
      const workOrders = await workOrdersRes.json();
      const inspections = await inspectionsRes.json();
      const contracts = await contractsRes.json();

      // Calculate analytics
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisYearStart = new Date(now.getFullYear(), 0, 1);

      const thisMonthRevenue = (invoices.invoices || [])
        .filter((i: any) => i.status === 'paid' && new Date(i.paidAt) >= thisMonthStart)
        .reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);

      const lastMonthRevenue = (invoices.invoices || [])
        .filter((i: any) => i.status === 'paid' && new Date(i.paidAt) >= lastMonthStart && new Date(i.paidAt) < thisMonthStart)
        .reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);

      const thisYearRevenue = (invoices.invoices || [])
        .filter((i: any) => i.status === 'paid' && new Date(i.paidAt) >= thisYearStart)
        .reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);

      const woList = workOrders.workOrders || [];
      const inspectionsList = inspections.inspections || [];
      const contractsList = contracts.contracts || [];

      setAnalytics({
        revenue: {
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          thisYear: thisYearRevenue
        },
        workOrders: {
          completed: woList.filter((w: any) => w.status === 'COMPLETED').length,
          scheduled: woList.filter((w: any) => w.status === 'SCHEDULED').length,
          inProgress: woList.filter((w: any) => w.status === 'IN_PROGRESS').length,
          cancelled: woList.filter((w: any) => w.status === 'CANCELLED').length
        },
        quality: {
          averageScore: inspectionsList.length > 0
            ? Math.round(
                inspectionsList
                  .filter((i: any) => i.score)
                  .reduce((sum: number, i: any) => sum + (i.score || 0), 0) /
                  inspectionsList.filter((i: any) => i.score).length
              )
            : 0,
          totalInspections: inspectionsList.length,
          defectsCount: inspectionsList.reduce((sum: number, i: any) => sum + (i.defectsCount || 0), 0)
        },
        contracts: {
          active: contractsList.filter((c: any) => c.status === 'ACTIVE').length,
          paused: contractsList.filter((c: any) => c.status === 'PAUSED').length,
          cancelled: contractsList.filter((c: any) => c.status === 'CANCELLED').length
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load analytics</div>
      </div>
    );
  }

  const revenueGrowth = analytics.revenue.lastMonth > 0
    ? ((analytics.revenue.thisMonth - analytics.revenue.lastMonth) / analytics.revenue.lastMonth) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg capitalize ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600">This Month</div>
            <div className="text-3xl font-bold text-green-600">
              ${analytics.revenue.thisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm mt-1 ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}% vs last month
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Last Month</div>
            <div className="text-3xl font-bold">
              ${analytics.revenue.lastMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">This Year</div>
            <div className="text-3xl font-bold">
              ${analytics.revenue.thisYear.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Work Orders Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Work Orders</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">{analytics.workOrders.completed}</div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{analytics.workOrders.scheduled}</div>
            <div className="text-sm text-gray-600 mt-1">Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600">{analytics.workOrders.inProgress}</div>
            <div className="text-sm text-gray-600 mt-1">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600">{analytics.workOrders.cancelled}</div>
            <div className="text-sm text-gray-600 mt-1">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Quality Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Quality Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600">Average QA Score</div>
            <div className={`text-4xl font-bold ${
              analytics.quality.averageScore >= 90 ? 'text-green-600' :
              analytics.quality.averageScore >= 75 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {analytics.quality.averageScore}%
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {analytics.quality.averageScore >= 90 ? '✅ Excellent' :
               analytics.quality.averageScore >= 75 ? '⚠️ Good' :
               '❌ Needs Improvement'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Inspections</div>
            <div className="text-4xl font-bold">{analytics.quality.totalInspections}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Defects</div>
            <div className="text-4xl font-bold text-red-600">{analytics.quality.defectsCount}</div>
          </div>
        </div>
      </div>

      {/* Contracts Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Contracts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-4xl font-bold text-green-600">{analytics.contracts.active}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Paused</div>
            <div className="text-4xl font-bold text-yellow-600">{analytics.contracts.paused}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Cancelled</div>
            <div className="text-4xl font-bold text-red-600">{analytics.contracts.cancelled}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

