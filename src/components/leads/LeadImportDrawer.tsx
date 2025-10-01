'use client';

import { useState, useRef } from 'react';

interface LeadImportDrawerProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  total?: number;
  processed?: number;
  errors?: string[];
}

export default function LeadImportDrawer({ onClose, onImportComplete }: LeadImportDrawerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }

      // Validate file size (max 10MB per binder1.md §2.3.1)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload file (per binder1.md §3.3)
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific errors per binder1.md §2.3.1
        if (response.status === 413) {
          throw new Error('File is too large (max 10MB)');
        }
        if (response.status === 415) {
          throw new Error('Unsupported file type (CSV only)');
        }
        if (response.status === 422) {
          throw new Error(errorData.message || 'Invalid CSV format or columns');
        }
        if (response.status === 429) {
          throw new Error('Too many imports. Please try again later.');
        }

        throw new Error(errorData.message || 'Upload failed');
      }

      // Get job ID (per binder1.md §3.3: returns 202 { jobId })
      const { jobId } = await response.json();
      
      // Start polling job status
      setJobStatus({
        jobId,
        status: 'pending',
        progress: 0,
      });

      pollJobStatus(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check job status');
      }

      const status: JobStatus = await response.json();
      setJobStatus(status);

      // Continue polling if not complete
      if (status.status === 'pending' || status.status === 'processing') {
        setTimeout(() => pollJobStatus(jobId), 1000); // Poll every second
      } else if (status.status === 'completed') {
        setUploading(false);
        setTimeout(() => {
          onImportComplete();
        }, 2000); // Show success for 2 seconds before closing
      } else if (status.status === 'failed') {
        setUploading(false);
        setError('Import failed. Please check your CSV and try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setJobStatus(null);
    setError(null);
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Leads from CSV</h2>
          <p className="text-sm text-gray-600 mt-1">Upload a CSV file to bulk import leads</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">CSV Format Requirements</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Required columns: <code className="bg-blue-100 px-1 rounded">name</code>, <code className="bg-blue-100 px-1 rounded">company</code></li>
              <li>Optional columns: <code className="bg-blue-100 px-1 rounded">email</code>, <code className="bg-blue-100 px-1 rounded">phone</code>, <code className="bg-blue-100 px-1 rounded">source</code></li>
              <li>Maximum file size: 10MB</li>
              <li>Duplicate emails will be skipped</li>
            </ul>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* File Upload */}
          {!jobStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="text-4xl mb-2">📄</div>
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-900">Click to select CSV file</p>
                      <p className="text-xs text-gray-600 mt-1">or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Job Status */}
          {jobStatus && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Import Status</span>
                <span className={`text-sm font-medium ${
                  jobStatus.status === 'completed' ? 'text-green-600' :
                  jobStatus.status === 'failed' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {jobStatus.status === 'pending' && 'Pending...'}
                  {jobStatus.status === 'processing' && 'Processing...'}
                  {jobStatus.status === 'completed' && 'Completed ✓'}
                  {jobStatus.status === 'failed' && 'Failed ✗'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    jobStatus.status === 'completed' ? 'bg-green-600' :
                    jobStatus.status === 'failed' ? 'bg-red-600' :
                    'bg-blue-600'
                  }`}
                  style={{ width: `${jobStatus.progress}%` }}
                />
              </div>

              {/* Progress Details */}
              {jobStatus.processed !== undefined && jobStatus.total !== undefined && (
                <p className="text-sm text-gray-600 text-center">
                  Processed {jobStatus.processed} of {jobStatus.total} leads
                </p>
              )}

              {/* Errors */}
              {jobStatus.errors && jobStatus.errors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-900 mb-1">
                    {jobStatus.errors.length} row(s) skipped:
                  </p>
                  <ul className="text-xs text-yellow-800 space-y-1 max-h-32 overflow-y-auto">
                    {jobStatus.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          {!jobStatus ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {uploading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {uploading ? 'Uploading...' : 'Upload & Import'}
              </button>
            </>
          ) : (
            <>
              {jobStatus.status === 'completed' || jobStatus.status === 'failed' ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Import Another File
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                disabled={jobStatus.status === 'processing'}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Close
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

