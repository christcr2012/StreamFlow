'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  address?: any;
  customerId?: string;
  ownerId?: string;
  ownerName?: string;
  notes?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  contacts?: Array<{
    id: string;
    name: string;
    email?: string;
    title?: string;
    isPrimary: boolean;
  }>;
  jobs?: Array<{
    id: string;
    serviceType: string;
    status: string;
    scheduledAt?: string;
  }>;
  opportunities?: Array<{
    id: string;
    title?: string;
    estValue?: number;
    stage: string;
  }>;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganization();
  }, [orgId]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tenant/crm/organizations/${orgId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Organization not found');
        }
        throw new Error('Failed to fetch organization');
      }

      const data = await response.json();
      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(revenue / 100);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <p className="text-red-800">{error || 'Organization not found'}</p>
          <button
            onClick={() => router.push('/crm/organizations')}
            className="mt-4 text-red-600 hover:text-red-800 font-medium"
          >
            ← Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/crm/organizations')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Organizations
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-2xl">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600 mt-1 capitalize">{organization.industry || 'No industry'}</p>
              {organization.archived && (
                <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  Archived
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/crm/organizations/${orgId}/edit`)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => router.push(`/jobs/new?organizationId=${orgId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Job
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Organization Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Website</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization.website ? (
                    <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                      {organization.domain || organization.website}
                    </a>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization.phone ? (
                    <a href={`tel:${organization.phone}`} className="text-blue-600 hover:text-blue-800">
                      {organization.phone}
                    </a>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {organization.email ? (
                    <a href={`mailto:${organization.email}`} className="text-blue-600 hover:text-blue-800">
                      {organization.email}
                    </a>
                  ) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Industry</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{organization.industry || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Company Size</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{organization.size || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Annual Revenue</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatRevenue(organization.annualRevenue)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900">{organization.ownerName || 'Unassigned'}</dd>
              </div>
            </dl>
          </div>

          {/* Contacts */}
          {organization.contacts && organization.contacts.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
                <button
                  onClick={() => router.push(`/crm/contacts/new?organizationId=${orgId}`)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Contact
                </button>
              </div>
              <div className="space-y-3">
                {organization.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{contact.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{contact.title || 'No title'}</p>
                        {contact.email && <p className="text-sm text-gray-600">{contact.email}</p>}
                      </div>
                      {contact.isPrimary && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opportunities */}
          {organization.opportunities && organization.opportunities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Opportunities</h2>
                <button
                  onClick={() => router.push(`/crm/opportunities/new?organizationId=${orgId}`)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  + Add Opportunity
                </button>
              </div>
              <div className="space-y-3">
                {organization.opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/crm/opportunities/${opp.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{opp.title || 'Untitled'}</h3>
                        <p className="text-sm text-gray-600 mt-1">{formatCurrency(opp.estValue)}</p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {opp.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Jobs (Bridge System) */}
          {organization.jobs && organization.jobs.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Jobs</h2>
              <div className="space-y-3">
                {organization.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/jobs/${job.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{job.serviceType}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {job.scheduledAt ? new Date(job.scheduledAt).toLocaleDateString() : 'Not scheduled'}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/crm/contacts/new?organizationId=${orgId}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-left"
              >
                Add Contact
              </button>
              <button
                onClick={() => router.push(`/crm/opportunities/new?organizationId=${orgId}`)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-left"
              >
                Create Opportunity
              </button>
              <button
                onClick={() => router.push(`/jobs/new?organizationId=${orgId}`)}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-left"
              >
                Create Job
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

