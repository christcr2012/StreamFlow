'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RFPStrategyDisplay, PricingAdviceDisplay, WinProbabilityIndicator } from '@/components/rfp-ai-analysis';

interface RFPDetail {
  id: string;
  publicId: string;
  title: string;
  sourceSite: string;
  dueDate: string | null;
  docs: any[];
  aiBidFit: number | null;
  aiPriceHint: any;
  createdAt: string;
  updatedAt: string;
}

export default function RFPDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rfpId = params?.id as string;

  const [rfp, setRfp] = useState<RFPDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'strategy' | 'pricing'>('overview');

  useEffect(() => {
    if (rfpId) {
      loadRFP();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfpId]);

  async function loadRFP() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/rfps/${rfpId}`);
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to load RFP');
        return;
      }

      setRfp(data.rfp);
    } catch (err: any) {
      setError(err.message || 'Failed to load RFP');
    } finally {
      setLoading(false);
    }
  }

  async function analyzeRFP() {
    if (!rfpId) return;

    try {
      setAnalyzing(true);
      const res = await fetch(`/api/rfps/${rfpId}/analyze`, { method: 'POST' });
      const data = await res.json();

      if (data.analyzed) {
        alert(`RFP analyzed successfully! Used ${data.creditsUsed} credits.`);
        await loadRFP();
      } else if (data.error) {
        alert(`Analysis failed: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setAnalyzing(false);
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

  if (error || !rfp) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            {error || 'RFP not found'}
          </p>
        </div>
      </div>
    );
  }

  const aiStrategy = rfp.aiPriceHint?.strategy;
  const aiPricing = rfp.aiPriceHint?.pricing;
  const aiAnalysisFailed = rfp.aiPriceHint?.aiAnalysisFailed || false;
  const confidence = rfp.aiPriceHint?.confidence;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to RFPs
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {rfp.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                {rfp.sourceSite}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                {rfp.publicId}
              </span>
              {rfp.dueDate && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Due: {new Date(rfp.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={analyzeRFP}
            disabled={analyzing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                AI analyzing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                Analyze with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('strategy')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'strategy'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            AI Strategy
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pricing'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Pricing Advice
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Documents */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Documents
              </h2>
              {rfp.docs && rfp.docs.length > 0 ? (
                <ul className="space-y-2">
                  {rfp.docs.map((doc: any, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      {doc.name || `Document ${index + 1}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No documents attached</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Win Probability */}
            {rfp.aiBidFit !== null && (
              <WinProbabilityIndicator
                probability={rfp.aiBidFit}
                confidence={confidence}
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'strategy' && (
        <div>
          {aiStrategy ? (
            <RFPStrategyDisplay
              strategy={aiStrategy}
              confidence={confidence}
              aiAnalysisFailed={aiAnalysisFailed}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No AI Strategy Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click &ldquo;Analyze with AI&rdquo; to generate bidding strategy and recommendations.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pricing' && (
        <div>
          {aiPricing ? (
            <PricingAdviceDisplay
              pricing={aiPricing}
              confidence={confidence}
              aiAnalysisFailed={aiAnalysisFailed}
            />
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">💰</div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Pricing Advice Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click &ldquo;Analyze with AI&rdquo; to generate pricing recommendations.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

