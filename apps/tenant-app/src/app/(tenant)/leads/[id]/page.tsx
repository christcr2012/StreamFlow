'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AIScoreBadge, AIScoreIndicator, UrgencyBadge } from '@/components/ai-score-badge';
import { ScoreHistoryChart } from '@/components/score-history-chart';

interface LeadDetail {
  id: string;
  publicId: string;
  sourceType: string;
  company?: string;
  contactName?: string;
  email?: string;
  phoneE164?: string;
  website?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  address?: string;
  aiScore: number;
  scoreFactors: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  notes?: string;
  enrichmentJson?: any;
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params?.id as string;

  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enriching, setEnriching] = useState(false);

  // CODE QUALITY: Fixed useEffect dependency - wrapped loadLead in useCallback
  const loadLead = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to load lead');
        return;
      }

      setLead(data.lead);
    } catch (err: any) {
      setError(err.message || 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (leadId) {
      loadLead();
    }
  }, [leadId, loadLead]);

  async function enrichLead() {
    if (!leadId) return;

    try {
      setEnriching(true);
      setError('');

      const res = await fetch(`/api/leads/${leadId}/enrich`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!data.ok) {
        // UX: User-friendly error message
        setError('Failed to enrich lead. Please try again.');
        return;
      }

      // Reload lead to show updated analysis
      await loadLead();

      // Show success message
      if (data.enriched) {
        alert(`Lead enriched successfully! Used ${data.creditsUsed} credits.`);
      } else {
        alert(`AI enrichment unavailable: ${data.reason}. Using basic scoring.`);
      }
    } catch (err: any) {
      // UX: User-friendly error message
      setError('Failed to enrich lead. Please try again.');
    } finally {
      setEnriching(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error || 'Lead not found'}
          </p>
        </div>
      </div>
    );
  }

  const aiAnalysis = lead.scoreFactors?.aiAnalysis;
  const aiAnalysisFailed = lead.scoreFactors?.aiAnalysisFailed === true;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Leads
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {lead.company || 'Unknown Company'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">{lead.publicId}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={enrichLead}
              disabled={enriching}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
            >
              {enriching && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.Org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {enriching ? 'AI analyzing...' : 'Enrich with AI'}
            </button>
            <AIScoreBadge
              score={lead.aiScore}
              confidence={aiAnalysis?.confidence}
              aiAnalysisFailed={aiAnalysisFailed}
              showConfidence={true}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* AI Unavailable Warning */}
      {aiAnalysisFailed && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                AI Analysis Unavailable
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                This lead is using basic scoring because AI analysis was unavailable at the time of
                creation. This may be due to budget limits or service issues. You can request a
                re-analysis when AI becomes available.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Contact Information
            </h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Contact Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {lead.contactName || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {lead.email || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {lead.phoneE164 || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {lead.website}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {[lead.city, lead.state, lead.postalCode].filter(Boolean).join(', ') || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {lead.sourceType}
                </dd>
              </div>
            </dl>
          </div>

          {/* AI Insights */}
          {aiAnalysis && !aiAnalysisFailed && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                AI Insights
              </h2>

              {/* Urgency Level */}
              {aiAnalysis.urgencyLevel && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Urgency Level
                  </label>
                  <UrgencyBadge urgency={aiAnalysis.urgencyLevel} />
                </div>
              )}

              {/* Key Opportunities */}
              {aiAnalysis.keyOpportunities && aiAnalysis.keyOpportunities.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Key Opportunities
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {aiAnalysis.keyOpportunities.map((opp: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-900 dark:text-gray-100">
                        {opp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Potential Challenges */}
              {aiAnalysis.potentialChallenges && aiAnalysis.potentialChallenges.length > 0 && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Potential Challenges
                  </label>
                  <ul className="list-disc list-inside space-y-1">
                    {aiAnalysis.potentialChallenges.map((challenge: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-900 dark:text-gray-100">
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommended Action */}
              {aiAnalysis.recommendedAction && (
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Recommended Action
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {aiAnalysis.recommendedAction}
                  </p>
                </div>
              )}

              {/* Estimated Value */}
              {aiAnalysis.estimatedValue && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Estimated Value
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {aiAnalysis.estimatedValue}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {lead.notes && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Notes
              </h2>
              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Score Card */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              AI Quality Score
            </h3>
            <AIScoreIndicator
              score={lead.aiScore}
              aiAnalysisFailed={aiAnalysisFailed}
              showLabel={false}
            />
          </div>

          {/* Score History Card */}
          {lead.scoreFactors && (lead.scoreFactors as any).scoreHistory && (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Score History
              </h3>
              <ScoreHistoryChart history={(lead.scoreFactors as any).scoreHistory} />
            </div>
          )}

          {/* Status Card */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Lead Status
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Current Status
                </label>
                <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {lead.status}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Created
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(lead.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {new Date(lead.updatedAt).toLocaleString()}
                </p>
              </div>
              {lead.convertedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-1">
                    Converted
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(lead.convertedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

