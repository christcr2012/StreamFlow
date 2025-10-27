// apps/tenant-app/src/app/reports/reports-client.tsx
// Reporting & Analytics UI - Phase 1

'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Calendar,
  Download,
  Filter,
} from 'lucide-react';

interface ReportsClientProps {
  orgId: string;
}

interface ReportData {
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growth: number;
    byMonth: Array<{ month: string; amount: number }>;
  };
  jobs: {
    total: number;
    completed: number;
    inProgress: number;
    scheduled: number;
    completionRate: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  customers: {
    total: number;
    new: number;
    active: number;
    satisfaction: number;
  };
  technicians: {
    total: number;
    avgJobsPerTech: number;
    topPerformer: string;
    topPerformerJobs: number;
  };
}

export function ReportsClient({ orgId }: ReportsClientProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  async function fetchReportData() {
    try {
      const res = await fetch(`/api/reports?dateRange=${dateRange}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data.reportData);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading reports...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-1">Business intelligence and insights</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            label="Total Revenue"
            value={`$${reportData.revenue.total.toLocaleString()}`}
            change={`+${reportData.revenue.growth}%`}
            changePositive={true}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            label="Jobs Completed"
            value={reportData.jobs.completed.toString()}
            change={`${reportData.jobs.completionRate}% rate`}
            changePositive={true}
            icon={Briefcase}
            color="blue"
          />
          <MetricCard
            label="Active Customers"
            value={reportData.customers.active.toString()}
            change={`${reportData.customers.new} new`}
            changePositive={true}
            icon={Users}
            color="purple"
          />
          <MetricCard
            label="Satisfaction"
            value={reportData.customers.satisfaction.toFixed(1)}
            change="Out of 5.0"
            changePositive={true}
            icon={TrendingUp}
            color="yellow"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Revenue Trend
            </h3>
            <div className="space-y-4">
              {reportData.revenue.byMonth.map((item, index) => {
                const maxAmount = Math.max(...reportData.revenue.byMonth.map((d) => d.amount));
                const percentage = (item.amount / maxAmount) * 100;

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.month}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${item.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Job Status Chart */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-green-600" />
              Job Status Breakdown
            </h3>
            <div className="space-y-4">
              {reportData.jobs.byStatus.map((item, index) => {
                const percentage = (item.count / reportData.jobs.total) * 100;
                const colors = ['bg-green-600', 'bg-yellow-600', 'bg-blue-600'];

                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${colors[index % colors.length]} h-3 rounded-full transition-all duration-300`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Insights */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h3>
            <div className="space-y-3">
              <InsightRow label="Total Customers" value={reportData.customers.total} />
              <InsightRow label="New This Period" value={reportData.customers.new} />
              <InsightRow label="Active Customers" value={reportData.customers.active} />
              <InsightRow
                label="Avg Satisfaction"
                value={`${reportData.customers.satisfaction}/5.0`}
              />
            </div>
          </div>

          {/* Technician Performance */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Performance</h3>
            <div className="space-y-3">
              <InsightRow label="Total Technicians" value={reportData.technicians.total} />
              <InsightRow
                label="Avg Jobs/Tech"
                value={reportData.technicians.avgJobsPerTech.toFixed(1)}
              />
              <InsightRow label="Top Performer" value={reportData.technicians.topPerformer} />
              <InsightRow
                label="Top Performer Jobs"
                value={reportData.technicians.topPerformerJobs}
              />
            </div>
          </div>
        </div>

        {/* Quick Reports */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReportButton
              title="Revenue by Service"
              description="Breakdown by service type"
              icon={DollarSign}
            />
            <ReportButton
              title="Customer Lifetime Value"
              description="Top customers by revenue"
              icon={Users}
            />
            <ReportButton
              title="Job Completion Time"
              description="Average time to complete"
              icon={Calendar}
            />
          </div>
        </div>

        {/* Phase 1 Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Phase 1: Stub Implementation</p>
              <p>
                Reports dashboard showing example data and charts. Phase 2 will implement real-time
                data queries, advanced filtering, custom report builder, and PDF/CSV export
                functionality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  change,
  changePositive,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  icon: any;
  color: string;
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className={`text-sm ${changePositive ? 'text-green-600' : 'text-red-600'}`}>{change}</p>
    </div>
  );
}

function InsightRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function ReportButton({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: any;
}) {
  return (
    <button className="text-left p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="font-medium text-gray-900 mb-1">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
}
