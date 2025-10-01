'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Opportunity {
  id: string;
  title?: string;
  customerId: string;
  customerName?: string;
  valueType: string;
  estValue?: number;
  stage: string;
  probability?: number;
  closeDate?: string;
  ownerId?: string;
  ownerName?: string;
  leadId?: string;
  leadName?: string;
  createdAt: string;
  updatedAt: string;
  notes?: Array<{
    id: string;
    body: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
  }>;
  quotes?: Array<{
    id: string;
    title: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  jobs?: Array<{
    id: string;
    serviceType: string;
    status: string;
    scheduledAt?: string;
  }>;
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const oppId = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetchOpportunity();
  }, [oppId]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tenant/crm/opportunities/${oppId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Opportunity not found');
        }
        throw new Error('Failed to fetch opportunity');
      }

      const data = await response.json();
      setOpportunity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!opportunity) return;

    try {
      const response = await fetch(`/api/tenant/crm/opportunities/${oppId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      const updated = await response.json();
      setOpportunity(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update stage');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      setAddingNote(true);

      const response = await fetch(`/api/tenant/crm/opportunities/${oppId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: noteText }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      await fetchOpportunity();
      setNoteText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value / 100);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading opportunity...</p>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <p className="text-red-800">{error || 'Opportunity not found'}</p>
          <button
            onClick={() => router.push('/crm/opportunities')}
            className="mt-4 text-red-600 hover:text-red-800 font-medium"
          >
            ← Back to Opportunities
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
          onClick={() => router.push('/crm/opportunities')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Opportunities
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{opportunity.title || 'Untitled Opportunity'}</h1>
            <p className="text-gray-600 mt-1">{opportunity.customerName}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/crm/opportunities/${oppId}/edit`)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Edit
            </button>
            <button
              onClick={() => router.push(`/jobs/new?opportunityId=${oppId}`)}
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
          {/* Opportunity Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Opportunity Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Value</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatCurrency(opportunity.estValue)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Probability</dt>
                <dd className="mt-1 text-sm text-gray-900">{opportunity.probability ? `${opportunity.probability}%` : 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Stage</dt>
                <dd className="mt-1">
                  <select
                    value={opportunity.stage}
                    onChange={(e) => handleStageChange(e.target.value)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(opportunity.stage)}`}
                  >
                    <option value="prospecting">Prospecting</option>
                    <option value="qualification">Qualification</option>
                    <option value="proposal">Proposal</option>
                    <option value="negotiation">Negotiation</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Close Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {opportunity.closeDate ? new Date(opportunity.closeDate).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900">{opportunity.ownerName || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Source Lead</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {opportunity.leadName ? (
                    <button
                      onClick={() => router.push(`/crm/leads/${opportunity.leadId}`)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {opportunity.leadName}
                    </button>
                  ) : 'N/A'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quotes */}
          {opportunity.quotes && opportunity.quotes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quotes</h2>
              <div className="space-y-3">
                {opportunity.quotes.map((quote) => (
                  <div key={quote.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{quote.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{formatCurrency(quote.total)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {quote.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Jobs */}
          {opportunity.jobs && opportunity.jobs.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Jobs</h2>
              <div className="space-y-3">
                {opportunity.jobs.map((job) => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/jobs/${job.id}`)}>
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

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes & Activity</h2>
            
            <div className="mb-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim() || addingNote}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>

            <div className="space-y-4">
              {opportunity.notes && opportunity.notes.length > 0 ? (
                opportunity.notes.map((note) => (
                  <div key={note.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-sm text-gray-900">{note.body}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {note.createdByName} • {new Date(note.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No notes yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/quotes/new?opportunityId=${oppId}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-left"
              >
                Create Quote
              </button>
              <button
                onClick={() => router.push(`/jobs/new?opportunityId=${oppId}`)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-left"
              >
                Create Job
              </button>
              <button
                onClick={() => router.push(`/crm/contacts?organizationId=${opportunity.customerId}`)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-left"
              >
                View Contacts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

