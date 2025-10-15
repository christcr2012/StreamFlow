'use client';

/**
 * Import Wizard Component - AI-Powered Multi-Step Wizard
 *
 * 7-Step Process:
 * 1. Upload Sample - Upload sample file (first 100 rows)
 * 2. Review Detection - Show detected format, columns, data types
 * 3. Map Fields - Interactive field mapping (AI-suggested or manual)
 * 4. Preview - Show transformed sample records
 * 5. Upload Full Data - Upload complete export file
 * 6. Process - Real-time progress tracking
 * 7. Review Results - Summary with success/error counts
 */

import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ProgressTracker, type ImportJob as ImportJobType } from './components/ProgressTracker';
import { TemplateManager, type ImportTemplate } from './components/TemplateManager';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ImportJob {
  id: string;
  status: string;
  entityType: string;
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  progressPercent: number;
  totalRows?: number;
  currentBatch?: number;
  totalBatches?: number;
  errorSummary?: string;
}

export function ImportWizard() {
  const [step, setStep] = useState<Step>(1);
  const [aiAssist, setAiAssist] = useState(true);
  const [entityType, setEntityType] = useState('CUSTOMERS');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [sampleContent, setSampleContent] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [importJobId, setImportJobId] = useState('');
  const [suggestions, setSuggestions] = useState<any>(null);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState<ImportJob | null>(null);
  const [estimateCents, setEstimateCents] = useState(0);
  const [tier, setTier] = useState('');

  // Poll for job status when processing
  useEffect(() => {
    if (step === 6 && importJobId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch('/api/owner/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status', importJobId }),
          });
          const data = await res.json();
          if (data.ok && data.job) {
            setJob(data.job);
            if (data.job.status === 'COMPLETED' || data.job.status === 'FAILED') {
              clearInterval(interval);
              if (data.job.status === 'COMPLETED') {
                setStep(7);
              }
            }
          }
        } catch (err) {
          console.error('Status poll error:', err);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step, importJobId]);

  // Step 1: Upload Sample
  async function handleSampleUpload(file: File) {
    setFileName(file.name);
    setFileSize(file.size);
    setError('');

    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      const lines = content.split('\n').slice(0, 100).join('\n'); // First 100 rows
      setSampleContent(btoa(lines)); // Base64 encode

      // Auto-advance to step 2
      setStep(2);
    };
    reader.readAsText(file);
  }

  // Step 2: Analyze with AI
  async function handleAnalyze() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/owner/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          aiAssist,
          entityType,
          fileName,
          fileContent: sampleContent,
          fileSize,
        }),
      });

      const data = await res.json();

      if (res.status === 402) {
        setError(`Payment Required: ${data.feature} - $${(data.required_prepay_cents / 100).toFixed(2)}`);
        return;
      }

      if (!data.ok) {
        setError(data.error || 'Analysis failed');
        return;
      }

      setImportJobId(data.importJobId);

      if (aiAssist && data.suggestions) {
        setSuggestions(data.suggestions);
        setMappings(data.suggestions.mappings || []);
        setEstimateCents(data.estimateCents || 0);
        setTier(data.tier || '');
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Save Mappings
  async function handleSaveMappings() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/owner/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'map',
          importJobId,
          mappings,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'Mapping save failed');
        return;
      }

      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Mapping save failed');
    } finally {
      setLoading(false);
    }
  }

  // Template Management
  async function handleSelectTemplate(template: ImportTemplate) {
    setMappings(template.fieldMappings || []);
    setSuggestions({
      mappings: template.fieldMappings,
      transforms: template.transformRules,
      validations: template.validationRules,
    });
    setStep(3);
  }

  async function handleSaveTemplate(
    name: string,
    mappings: any[],
    transforms?: any[],
    validations?: any[]
  ) {
    const res = await fetch('/api/owner/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save-template',
        name,
        entityType,
        sourceFormat: fileName.split('.').pop()?.toLowerCase() || 'csv',
        fieldMappings: mappings,
        transformRules: transforms,
        validationRules: validations,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      throw new Error(data.error || 'Failed to save template');
    }
  }

  // Step 5: Upload Full File
  async function handleFullUpload(file: File) {
    setError('');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result as string;
      setFullContent(btoa(content)); // Base64 encode

      // Execute import
      try {
        const res = await fetch('/api/owner/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute',
            importJobId,
            fileName: file.name,
            fileContent: btoa(content),
          }),
        });

        const data = await res.json();

        if (!data.ok) {
          setError(data.message || data.error || 'Import execution failed');
          setLoading(false);
          return;
        }

        setStep(6);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Import execution failed');
        setLoading(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Import Wizard</h1>
        <p className="text-gray-600">
          AI-powered data migration from your previous software system
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 7 && (
                <div
                  className={`w-12 h-1 ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-600 text-center">
          {step === 1 && 'Upload Sample'}
          {step === 2 && 'Review Detection'}
          {step === 3 && 'Map Fields'}
          {step === 4 && 'Preview'}
          {step === 5 && 'Upload Full Data'}
          {step === 6 && 'Processing'}
          {step === 7 && 'Results'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step 1: Upload Sample */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold">Step 1: Upload Sample File</h2>
            <p className="text-gray-600">
              Upload a sample of your data (first 100 rows) for analysis
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="CUSTOMERS">Customers</option>
                <option value="JOBS">Jobs/Projects</option>
                <option value="INVOICES">Invoices</option>
                <option value="ESTIMATES">Estimates/Quotes</option>
              </select>
            </div>

            <FileUpload
              accept=".csv,.xlsx,.xls,.json,.xml"
              maxSizeMB={50}
              onFileSelect={handleSampleUpload}
              label="Sample File"
              description="Drag and drop your file here, or click to browse"
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="aiAssist"
                checked={aiAssist}
                onChange={(e) => setAiAssist(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="aiAssist" className="text-sm text-gray-700">
                Use AI Assistant (recommended - saves 20-40 minutes)
              </label>
            </div>
          </div>

          {/* Template Manager */}
          <TemplateManager
            entityType={entityType}
            onSelectTemplate={handleSelectTemplate}
            onSaveTemplate={handleSaveTemplate}
          />
        </div>
      )}

      {/* Step 2: Review Detection */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Step 2: Review Detection</h2>
          <p className="text-gray-600">
            File: <strong>{fileName}</strong> ({(fileSize / 1024).toFixed(1)} KB)
          </p>

          {aiAssist && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                AI will analyze your data and suggest field mappings.
                Estimated cost: <strong>${(estimateCents / 100).toFixed(2)}</strong> ({tier} tier)
              </p>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Analyzing...' : 'Analyze File'}
          </button>
        </div>
      )}

      {/* Step 3: Map Fields */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold">Step 3: Map Fields</h2>
            <p className="text-gray-600">
              Review and adjust field mappings
            </p>

            {mappings.length > 0 && (
              <div className="space-y-2">
                {mappings.map((mapping, idx) => (
                  <div key={idx} className="flex items-center space-x-4 p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{mapping.source}</span>
                    </div>
                    <div className="text-gray-400">→</div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-blue-600">{mapping.target}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-gray-500">
                        {Math.round(mapping.confidence * 100)}% confident
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSaveMappings}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </div>

          {/* Template Manager for saving current mappings */}
          <TemplateManager
            entityType={entityType}
            onSelectTemplate={handleSelectTemplate}
            onSaveTemplate={handleSaveTemplate}
            currentMappings={mappings}
            currentTransforms={suggestions?.transforms}
            currentValidations={suggestions?.validations}
          />
        </div>
      )}

      {/* Step 4: Preview */}
      {step === 4 && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Step 4: Preview</h2>
          <p className="text-gray-600">
            Mappings saved successfully. Ready to import full file.
          </p>

          <button
            onClick={() => setStep(5)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue to Upload
          </button>
        </div>
      )}

      {/* Step 5: Upload Full Data */}
      {step === 5 && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Step 5: Upload Full Data</h2>
          <p className="text-gray-600">
            Upload your complete export file
          </p>

          <FileUpload
            accept=".csv,.xlsx,.xls,.json,.xml"
            maxSizeMB={50}
            onFileSelect={handleFullUpload}
            disabled={loading}
            label="Full Export File"
            description="Drag and drop your complete file here, or click to browse"
          />

          {loading && (
            <div className="flex items-center justify-center space-x-3 py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Uploading and starting import...</span>
            </div>
          )}
        </div>
      )}

      {/* Step 6: Processing */}
      {step === 6 && importJobId && (
        <ProgressTracker
          importJobId={importJobId}
          onComplete={(completedJob) => {
            setJob(completedJob as any);
            setStep(7);
          }}
          onError={(err) => setError(err)}
        />
      )}

      {/* Step 7: Results */}
      {step === 7 && job && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Step 7: Import Complete!</h2>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded">
              <div className="text-3xl font-bold text-green-600">{job.successCount}</div>
              <div className="text-sm text-gray-600">Imported</div>
            </div>
            <div className="p-4 bg-red-50 rounded">
              <div className="text-3xl font-bold text-red-600">{job.errorCount}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <div className="text-3xl font-bold text-yellow-600">{job.skipCount}</div>
              <div className="text-sm text-gray-600">Duplicates</div>
            </div>
          </div>

          {job.errorCount > 0 && (
            <button
              onClick={async () => {
                const res = await fetch('/api/owner/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'errors', importJobId, format: 'csv' }),
                });
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `import-errors-${importJobId}.csv`;
                a.click();
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Download Error Report
            </button>
          )}

          <button
            onClick={() => {
              setStep(1);
              setImportJobId('');
              setSuggestions(null);
              setMappings([]);
              setJob(null);
              setError('');
            }}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Start New Import
          </button>
        </div>
      )}
    </div>
  );
}
