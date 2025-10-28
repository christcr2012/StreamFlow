/**
 * Cleaning Estimates List Page
 * 
 * Displays all cleaning estimates with Good/Better/Best pricing
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface CleaningEstimate {
  id: string;
  leadId?: string;
  version: number;
  spaceType: string;
  squareFeet: number;
  frequency: string;
  optionsJson: string;
  status: string;
  createdAt: string;
  lead?: {
    contactName: string;
    company?: string;
  };
}

interface PricingOption {
  tier: string;
  price: number;
  scope: string;
  features: string[];
}

export default function CleaningEstimatesPage() {
  const [estimates, setEstimates] = useState<CleaningEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.set('status', filter);
      }
      const response = await fetch(`/api/cleaning/estimates?${params}`);
      if (!response.ok) throw new Error('Failed to fetch estimates');
      const data = await response.json();
      setEstimates(data.estimates || []);
    } catch (error) {
      console.error('Error fetching estimates:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);



  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      SENT: 'bg-blue-100 text-blue-800',
      VIEWED: 'bg-purple-100 text-purple-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const getPriceRange = (optionsJson: string): string => {
    try {
      const options: PricingOption[] = JSON.parse(optionsJson);
      const prices = options.map(o => o.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading estimates...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Cleaning Estimates</h1>
        <Link
          href="/cleaning/estimates/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Estimate
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2">
          {['all', 'DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED'].map((status) => (
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

      {/* Estimates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {estimates.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-lg shadow text-center text-gray-500">
            No estimates found. Create your first estimate to get started.
          </div>
        ) : (
          estimates.map((estimate) => (
            <div key={estimate.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {estimate.lead?.contactName || 'Direct Estimate'}
                  </h3>
                  {estimate.lead?.company && (
                    <div className="text-sm text-gray-500">{estimate.lead.company}</div>
                  )}
                </div>
                {getStatusBadge(estimate.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Space Type:</span>
                  <span className="font-medium capitalize">{estimate.spaceType.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{estimate.squareFeet.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium capitalize">{estimate.frequency.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price Range:</span>
                  <span className="font-medium">{getPriceRange(estimate.optionsJson)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">v{estimate.version}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                Created {new Date(estimate.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/cleaning/estimates/${estimate.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700"
                >
                  View Details
                </Link>
                {estimate.status === 'ACCEPTED' && (
                  <Link
                    href={`/cleaning/contracts/new?estimateId=${estimate.id}`}
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700"
                  >
                    Create Contract
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

