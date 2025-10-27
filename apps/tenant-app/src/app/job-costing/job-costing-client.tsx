'use client';
import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Briefcase, AlertTriangle } from 'lucide-react';

export function JobCostingClient({ orgId }: { orgId: string }) {
  const [jobCosts, setJobCosts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/job-costing').then(r => r.json()).then(d => {
      setJobCosts(d.jobCosts || []);
      setSummary(d.summary);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><h1 className="text-3xl font-bold text-gray-900">Job Costing</h1><p className="text-gray-600 mt-1">Track costs and profitability by job</p></div></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Total Revenue</p><p className="text-2xl font-bold text-green-600">${summary.totalRevenue.toFixed(2)}</p></div>
            <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Total Cost</p><p className="text-2xl font-bold text-red-600">${summary.totalCost.toFixed(2)}</p></div>
            <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Total Profit</p><p className="text-2xl font-bold text-blue-600">${summary.totalProfit.toFixed(2)}</p></div>
            <div className="bg-white rounded-lg border p-6"><p className="text-sm text-gray-600">Avg Margin</p><p className="text-2xl font-bold text-purple-600">{summary.avgMargin.toFixed(1)}%</p></div>
          </div>
        )}

        <div className="space-y-4">
          {jobCosts.map(job => {
            const variance = job.actualCost - job.estimatedCost;
            const isOverBudget = variance > 0;

            return (
              <div key={job.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.jobTitle}</h3>
                    <p className="text-sm text-gray-600">{job.status === 'completed' ? `Completed ${new Date(job.completedAt).toLocaleDateString()}` : 'In Progress'}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${job.profitMargin > 30 ? 'bg-green-100 text-green-800' : job.profitMargin > 15 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>{job.profitMargin.toFixed(1)}% margin</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div><p className="text-xs text-gray-500 mb-1">Estimated Cost</p><p className="text-lg font-semibold text-gray-700">${job.estimatedCost.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Actual Cost</p><p className="text-lg font-semibold text-gray-900">${job.actualCost.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Revenue</p><p className="text-lg font-semibold text-green-600">${job.revenue.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Profit</p><p className="text-lg font-semibold text-blue-600">${job.profit.toFixed(2)}</p></div>
                </div>

                {isOverBudget && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm text-red-800">Over budget by ${variance.toFixed(2)}</p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div><p className="text-xs text-gray-500 mb-1">Labor</p><p className="text-sm font-medium text-gray-900">${job.costs.labor.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Materials</p><p className="text-sm font-medium text-gray-900">${job.costs.materials.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Equipment</p><p className="text-sm font-medium text-gray-900">${job.costs.equipment.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500 mb-1">Overhead</p><p className="text-sm font-medium text-gray-900">${job.costs.overhead.toFixed(2)}</p></div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4"><div className="flex items-start gap-3"><TrendingUp className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" /><div className="text-sm text-yellow-800"><p className="font-medium mb-1">Phase 1: Stub Implementation</p><p>Job costing with stub data. Phase 2: Real cost tracking, budget alerts, variance analysis.</p></div></div></div>
      </div>
    </div>
  );
}
