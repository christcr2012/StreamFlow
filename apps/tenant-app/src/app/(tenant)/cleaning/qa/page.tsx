/**
 * Cleaning QA Inspections Page
 * 
 * QA inspection scoring interface with defect tracking
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CleaningInspection {
  id: string;
  workOrderId: string;
  inspectorId?: string;
  inspectedAt?: string;
  checklistJson: string;
  score?: number;
  defectsCount: number;
  status: string;
  createdAt: string;
}

export default function CleaningQAPage() {
  const [inspections, setInspections] = useState<CleaningInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchInspections();
  }, [filter]);

  const fetchInspections = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      
      const response = await fetch(`/api/cleaning/inspections?${params}`);
      if (!response.ok) throw new Error('Failed to fetch inspections');
      
      const data = await response.json();
      setInspections(data.inspections || []);
    } catch (error) {
      console.error('Error fetching inspections:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score?: number) => {
    if (!score) return 'N/A';
    if (score >= 90) return '✅ Excellent';
    if (score >= 75) return '⚠️ Good';
    return '❌ Needs Improvement';
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading inspections...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Quality Assurance</h1>
        <Link
          href="/cleaning/qa/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Inspection
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Inspections</div>
          <div className="text-3xl font-bold mt-2">{inspections.length}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Average Score</div>
          <div className="text-3xl font-bold mt-2">
            {inspections.length > 0
              ? Math.round(
                  inspections
                    .filter(i => i.score)
                    .reduce((sum, i) => sum + (i.score || 0), 0) /
                    inspections.filter(i => i.score).length
                )
              : 0}
            %
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-3xl font-bold mt-2">
            {inspections.filter(i => i.status === 'PENDING').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Defects</div>
          <div className="text-3xl font-bold mt-2">
            {inspections.reduce((sum, i) => sum + i.defectsCount, 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2">
          {['all', 'PENDING', 'COMPLETED', 'FAILED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Inspections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspections.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg shadow text-center text-gray-500">
            No inspections found. Create your first inspection to get started.
          </div>
        ) : (
          inspections.map((inspection) => (
            <div key={inspection.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Work Order</h3>
                  <div className="text-sm text-gray-500">{inspection.workOrderId.slice(0, 8)}...</div>
                </div>
                {getStatusBadge(inspection.status)}
              </div>

              {/* Score Display */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Quality Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(inspection.score)}`}>
                    {inspection.score ? `${inspection.score}%` : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      !inspection.score
                        ? 'bg-gray-400'
                        : inspection.score >= 90
                        ? 'bg-green-600'
                        : inspection.score >= 75
                        ? 'bg-yellow-600'
                        : 'bg-red-600'
                    }`}
                    style={{ width: `${inspection.score || 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {getScoreBadge(inspection.score)}
                </div>
              </div>

              {/* Defects */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Defects Found</span>
                  <span className={`font-semibold ${inspection.defectsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {inspection.defectsCount}
                  </span>
                </div>
              </div>

              {/* Inspector & Date */}
              <div className="space-y-2 mb-4 text-sm">
                {inspection.inspectorId && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">👤 Inspector:</span>
                    <span className="font-medium">{inspection.inspectorId.slice(0, 8)}...</span>
                  </div>
                )}
                {inspection.inspectedAt && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📅 Inspected:</span>
                    <span className="font-medium">
                      {new Date(inspection.inspectedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link
                  href={`/cleaning/qa/${inspection.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Score Distribution */}
      {inspections.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Score Distribution</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {inspections.filter(i => i.score && i.score >= 90).length}
              </div>
              <div className="text-sm text-gray-600">Excellent (90%+)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {inspections.filter(i => i.score && i.score >= 75 && i.score < 90).length}
              </div>
              <div className="text-sm text-gray-600">Good (75-89%)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {inspections.filter(i => i.score && i.score < 75).length}
              </div>
              <div className="text-sm text-gray-600">Needs Improvement (&lt;75%)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

