'use client';

import { useEffect, useState } from 'react';

export interface ImportJob {
  id: string;
  status: string;
  progressPercent: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  totalRows: number;
  currentBatch: number;
  totalBatches: number;
  errorSummary?: string;
}

interface ProgressTrackerProps {
  importJobId: string;
  onComplete: (job: ImportJob) => void;
  onError: (error: string) => void;
}

export function ProgressTracker({ importJobId, onComplete, onError }: ProgressTrackerProps) {
  const [job, setJob] = useState<ImportJob | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!importJobId || !polling) return;

    const pollStatus = async () => {
      try {
        const res = await fetch('/api/owner/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'status',
            importJobId,
          }),
        });

        const data = await res.json();

        if (!data.ok) {
          onError(data.error || 'Failed to fetch status');
          setPolling(false);
          return;
        }

        setJob(data.job);

        // Check if complete
        if (data.job.status === 'COMPLETED' || data.job.status === 'FAILED') {
          setPolling(false);
          onComplete(data.job);
        }
      } catch (err: any) {
        onError(err.message || 'Failed to fetch status');
        setPolling(false);
      }
    };

    // Poll immediately
    pollStatus();

    // Then poll every 2 seconds
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [importJobId, polling, onComplete, onError]);

  if (!job) {
    return (
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Initializing import...</span>
        </div>
      </div>
    );
  }

  const progressPercent = job.progressPercent || 0;
  const isProcessing = job.status === 'PROCESSING';
  const isFailed = job.status === 'FAILED';

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          {isProcessing ? 'Processing Import...' : isFailed ? 'Import Failed' : 'Import Complete'}
        </h2>
        <p className="text-sm text-gray-600">
          {isProcessing
            ? `Batch ${job.currentBatch} of ${job.totalBatches}`
            : isFailed
            ? job.errorSummary || 'Import failed'
            : 'All records processed'}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-gray-600">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isFailed ? 'bg-red-600' : 'bg-blue-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{job.totalRows}</div>
          <div className="text-xs text-gray-600 mt-1">Total Rows</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{job.successCount}</div>
          <div className="text-xs text-gray-600 mt-1">Imported</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{job.errorCount}</div>
          <div className="text-xs text-gray-600 mt-1">Errors</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{job.skipCount}</div>
          <div className="text-xs text-gray-600 mt-1">Skipped</div>
        </div>
      </div>

      {/* Processing Animation */}
      {isProcessing && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <div className="animate-pulse">●</div>
          <div className="animate-pulse animation-delay-200">●</div>
          <div className="animate-pulse animation-delay-400">●</div>
          <span className="ml-2">Processing records...</span>
        </div>
      )}

      {/* Error Summary */}
      {isFailed && job.errorSummary && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{job.errorSummary}</p>
        </div>
      )}
    </div>
  );
}

