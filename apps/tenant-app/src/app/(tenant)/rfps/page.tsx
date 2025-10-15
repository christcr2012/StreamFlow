'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface RFP {
  id: string;
  publicId: string;
  title: string;
  sourceSite: string;
  dueDate: string | null;
  aiBidFit: number | null;
  aiPriceHint: any;
  createdAt: string;
}

export default function RFPsPage() {
  const [rfps, setRfps] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRFPs();
  }, []);

  async function loadRFPs() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/rfps');
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Failed to load RFPs');
        return;
      }

      setRfps(data.rfps || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load RFPs');
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          RFPs & Opportunities
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Government contract opportunities with AI-powered bidding insights
        </p>
      </div>

      {/* RFP List */}
      {rfps.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No RFPs Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            RFPs will appear here when they are imported or created.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rfps.map((rfp) => {
            const daysUntilDue = rfp.dueDate
              ? Math.ceil((new Date(rfp.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : null;

            const getBidFitColor = (score: number | null) => {
              if (score === null) return 'gray';
              if (score >= 70) return 'green';
              if (score >= 40) return 'yellow';
              return 'red';
            };

            const getBidFitLabel = (score: number | null) => {
              if (score === null) return 'Not Analyzed';
              if (score >= 70) return 'HIGH FIT';
              if (score >= 40) return 'MEDIUM FIT';
              return 'LOW FIT';
            };

            const bidFitColor = getBidFitColor(rfp.aiBidFit);
            const bidFitLabel = getBidFitLabel(rfp.aiBidFit);

            return (
              <div key={rfp.id}>
                {/* @ts-ignore - Next.js 15 Link type issue */}
                <Link
                  href={`/rfps/${rfp.id}`}
                  className="block bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {rfp.title}
                        </h2>
                        {rfp.aiBidFit !== null && (
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${
                              bidFitColor === 'green'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                : bidFitColor === 'yellow'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                : bidFitColor === 'red'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                            }`}
                          >
                            {bidFitLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                      </div>

                      {rfp.dueDate && (
                        <div className="flex items-center gap-2 text-sm">
                          <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">
                            Due: {new Date(rfp.dueDate).toLocaleDateString()}
                          </span>
                          {daysUntilDue !== null && (
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded ${
                                daysUntilDue <= 7
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                  : daysUntilDue <= 14
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                              }`}
                            >
                              {daysUntilDue > 0 ? `${daysUntilDue} days left` : 'Overdue'}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {rfp.aiBidFit !== null && (
                      <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-gray-200 dark:text-gray-700"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${(rfp.aiBidFit / 100) * 175.93} 175.93`}
                              className={`${
                                bidFitColor === 'green'
                                  ? 'text-green-600 dark:text-green-500'
                                  : bidFitColor === 'yellow'
                                  ? 'text-yellow-600 dark:text-yellow-500'
                                  : 'text-red-600 dark:text-red-500'
                              }`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              {rfp.aiBidFit}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bid Fit</span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

