'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OrganizationCreateModal from '@/components/crm/organizations/OrganizationCreateModal';

interface Organization {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  annualRevenue?: number;
  website?: string;
  phone?: string;
  email?: string;
  customerId?: string;
  archived: boolean;
  createdAt: string;
}

export default function OrganizationsPage() {
  const router = useRouter();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchOrganizations();
  }, [page, searchQuery, industryFilter]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery) params.append('query', searchQuery);
      if (industryFilter) params.append('industry', industryFilter);

      const response = await fetch(`/api/tenant/crm/organizations?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }

      const data = await response.json();
      setOrganizations(data.organizations);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrganizations();
  };

  const handleOrganizationCreated = (organization: Organization) => {
    setShowCreateModal(false);
    fetchOrganizations();
  };

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(revenue / 100);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
        <p className="text-gray-600 mt-1">Manage your business organizations</p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search organizations by name, domain, or email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </form>

          {/* Industry Filter */}
          <select
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Industries</option>
            <option value="hvac">HVAC</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="landscaping">Landscaping</option>
            <option value="cleaning">Cleaning</option>
            <option value="other">Other</option>
          </select>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
          >
            + New Organization
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading organizations...</p>
        </div>
      )}

      {/* Organizations Grid */}
      {!loading && organizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              onClick={() => router.push(`/crm/organizations/${org.id}`)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Organization Icon */}
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">
                    {org.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {org.archived && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    Archived
                  </span>
                )}
              </div>

              {/* Organization Info */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{org.name}</h3>
              
              {org.industry && (
                <p className="text-sm text-gray-600 mb-2 capitalize">{org.industry}</p>
              )}

              <div className="space-y-1 text-sm text-gray-600">
                {org.website && (
                  <p className="truncate">
                    <a
                      href={org.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {org.domain || org.website}
                    </a>
                  </p>
                )}
                {org.phone && <p>{org.phone}</p>}
                {org.email && <p>{org.email}</p>}
              </div>

              {/* Revenue & Size */}
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-sm">
                <div>
                  <p className="text-gray-500">Revenue</p>
                  <p className="font-medium text-gray-900">{formatRevenue(org.annualRevenue)}</p>
                </div>
                {org.size && (
                  <div>
                    <p className="text-gray-500">Size</p>
                    <p className="font-medium text-gray-900 capitalize">{org.size}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && organizations.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first organization.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Create Organization
          </button>
        </div>
      )}

      {/* Pagination */}
      {!loading && organizations.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} organizations
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <OrganizationCreateModal
          onClose={() => setShowCreateModal(false)}
          onOrganizationCreated={handleOrganizationCreated}
        />
      )}
    </div>
  );
}

