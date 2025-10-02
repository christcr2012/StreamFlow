'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Lead {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  stage: string;
  sourceType: string;
  ownerId?: string;
  ownerName?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: Array<{
    id: string;
    body: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
  }>;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;

  if (!leadId) {
    return <div>Invalid lead ID</div>;
  }

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiNextAction, setAiNextAction] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/leads/${leadId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Lead not found');
        }
        throw new Error('Failed to fetch lead');
      }

      const data = await response.json();
      setLead(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!lead) return;
    
    // TODO: Implement edit form
    setEditing(true);
  };

  const handleAssign = async (ownerId: string) => {
    if (!lead) return;

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign lead');
      }

      const updated = await response.json();
      setLead(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to assign lead');
    }
  };

  const handleArchive = async () => {
    if (!lead || !confirm('Are you sure you want to archive this lead?')) return;

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to archive lead');
      }

      router.push('/leads');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to archive lead');
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      setAddingNote(true);

      const response = await fetch(`/api/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: noteText }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      // Refresh lead to get updated notes
      await fetchLead();
      setNoteText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleAiSummarize = async () => {
    if (!lead) return;

    try {
      setAiLoading(true);

      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'lead', id: leadId }),
      });

      if (!response.ok) {
        throw new Error('AI summarization failed');
      }

      const { summary } = await response.json();
      setAiSummary(summary);
    } catch (err) {
      // Fallback per binder1.md §5: show raw notes if AI unavailable
      setAiSummary('AI unavailable. Recent notes: ' + (lead.notes?.map(n => n.body).join('; ') || 'No notes'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiNextAction = async () => {
    if (!lead) return;

    try {
      setAiLoading(true);

      const response = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: `Lead: ${lead.name} at ${lead.company}, Stage: ${lead.stage}`,
          question: 'What is the next best action for this lead?',
        }),
      });

      if (!response.ok) {
        throw new Error('AI suggestion failed');
      }

      const { answer } = await response.json();
      setAiNextAction(answer);
    } catch (err) {
      setAiNextAction('AI unavailable. Consider: Follow up via email or schedule a call.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <p className="text-red-800">{error || 'Lead not found'}</p>
          <button
            onClick={() => router.push('/leads')}
            className="mt-4 text-red-600 hover:text-red-800 font-medium"
          >
            ← Back to Leads
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
          onClick={() => router.push('/leads')}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back to Leads
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-600 mt-1">{lead.company}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Edit
            </button>
            <button
              onClick={handleArchive}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              Archive
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Lead Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.email || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.phone || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Stage</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.stage}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Source</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.sourceType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Owner</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.ownerName || 'Unassigned'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes & Activity</h2>
            
            {/* Add Note */}
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

            {/* Notes List */}
            <div className="space-y-4">
              {lead.notes && lead.notes.length > 0 ? (
                lead.notes.map((note) => (
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

        {/* AI Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🤖 AI Assistant</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleAiSummarize}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-left disabled:opacity-50"
              >
                Summarize Timeline
              </button>
              
              <button
                onClick={handleAiNextAction}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-left disabled:opacity-50"
              >
                Next Best Action
              </button>
            </div>

            {aiLoading && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">AI thinking...</p>
              </div>
            )}

            {aiSummary && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Summary</h3>
                <p className="text-sm text-gray-700">{aiSummary}</p>
              </div>
            )}

            {aiNextAction && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Suggested Action</h3>
                <p className="text-sm text-gray-700">{aiNextAction}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

