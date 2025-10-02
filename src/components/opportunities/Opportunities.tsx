'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  customerName?: string;
  valueType: string;
  estValue?: number;
  stage: string;
  probability?: number;
  closeDate?: string;
  ownerId?: string;
  ownerName?: string;
  createdAt: string;
}

interface OpportunitiesResponse {
  opportunities: Opportunity[];
  total: number;
  page: number;
  pageSize: number;
}

export default function OpportunitiesIndexPage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');

  useEffect(() => {
    fetchOpportunities();
  }, [page, searchQuery, stageFilter, ownerFilter]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(searchQuery && { query: searchQuery }),
        ...(stageFilter && { stage: stageFilter }),
        ...(ownerFilter && { owner: ownerFilter }),
      });

      const response = await fetch(`/api/opportunities?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch opportunities');
      }

      const data: OpportunitiesResponse = await response.json();
      setOpportunities(data.opportunities);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'prospecting': return 'bg-blue-100 text-blue-800';
      case 'qualification': return 'bg-yellow-100 text-yellow-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed_won': return 'bg-green-600 text-white';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value / 100); // Assuming value is in cents
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
        <p className="text-gray-600 mt-1">Manage your sales pipeline</p>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search opportunities"
            />
          </div>

          {/* Action Button */}
          <button
            onClick={() => router.push('/opportunities/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            aria-label="New Opportunity"
          >
            + New Opportunity
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by stage"
          >
            <option value="">All Stages</option>
            <option value="prospecting">Prospecting</option>
            <option value="qualification">Qualification</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>

          {/* Clear Filters */}
          {(stageFilter || searchQuery) && (
            <button
              onClick={() => {
                setStageFilter('');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading opportunities...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchOpportunities}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && opportunities.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">💼</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No opportunities found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || stageFilter
              ? 'Try adjusting your filters'
              : 'Get started by creating your first opportunity'}
          </p>
          <button
            onClick={() => router.push('/opportunities/new')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create First Opportunity
          </button>
        </div>
      )}

      {/* Opportunities Table */}
      {!loading && !error && opportunities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Probability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Close Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Owner
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {opportunities.map((opp) => (
                <tr
                  key={opp.id}
                  onClick={() => router.push(`/opportunities/${opp.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{opp.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{opp.customerName || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCurrency(opp.estValue)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(opp.stage)}`}>
                      {opp.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {opp.probability ? `${opp.probability}%` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {opp.closeDate ? new Date(opp.closeDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {opp.ownerName || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} opportunities
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline Summary */}
      {!loading && !error && opportunities.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(opportunities.reduce((sum, opp) => sum + (opp.estValue || 0), 0))}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Open Opportunities</p>
            <p className="text-2xl font-bold text-gray-900">
              {opportunities.filter(o => !o.stage.includes('closed')).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Won This Month</p>
            <p className="text-2xl font-bold text-green-600">
              {opportunities.filter(o => o.stage === 'closed_won').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-sm text-gray-600">Avg. Deal Size</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                opportunities.reduce((sum, opp) => sum + (opp.estValue || 0), 0) / opportunities.length
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

