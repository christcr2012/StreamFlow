// src/pages/dev/system-validation.tsx

/**
 * 🧪 COMPREHENSIVE SYSTEM VALIDATION DASHBOARD
 * 
 * Complete system health monitoring and validation interface.
 * Tests all major components and provides detailed status reporting.
 */

import { useState } from 'react';
import { DeveloperLayout } from '@/components/DeveloperLayout';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, PlayIcon } from '@heroicons/react/24/outline';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number;
  details?: string;
  error?: string;
}

interface SystemTestResponse {
  success: boolean;
  overallStatus: 'passed' | 'failed' | 'warning';
  totalTests: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  duration: number;
  results: TestResult[];
  summary: {
    database: 'healthy' | 'degraded' | 'failed';
    authentication: 'healthy' | 'degraded' | 'failed';
    security: 'healthy' | 'degraded' | 'failed';
    models: 'healthy' | 'degraded' | 'failed';
  };
}

export default function SystemValidationPage() {
  const [testResults, setTestResults] = useState<SystemTestResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSystemTests = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dev/system-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: 'passed' | 'failed' | 'warning') => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />;
    }
  };

  const getHealthColor = (health: 'healthy' | 'degraded' | 'failed') => {
    switch (health) {
      case 'healthy':
        return 'text-green-400';
      case 'degraded':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
    }
  };

  const getHealthBadge = (health: 'healthy' | 'degraded' | 'failed') => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full";
    switch (health) {
      case 'healthy':
        return `${baseClasses} bg-green-900/50 text-green-400 border border-green-500/30`;
      case 'degraded':
        return `${baseClasses} bg-yellow-900/50 text-yellow-400 border border-yellow-500/30`;
      case 'failed':
        return `${baseClasses} bg-red-900/50 text-red-400 border border-red-500/30`;
    }
  };

  return (
    <DeveloperLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-gray-800 pb-6">
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 System Validation
          </h1>
          <p className="text-gray-400">
            Comprehensive system health monitoring and validation dashboard
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">System Tests</h2>
              <p className="text-gray-400">
                Run comprehensive tests to validate all system components
              </p>
            </div>
            <button
              onClick={runSystemTests}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              <PlayIcon className="h-5 w-5" />
              {isRunning ? 'Running Tests...' : 'Run System Tests'}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/50 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <XCircleIcon className="h-6 w-6 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-400">Test Error</h3>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Database</h3>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold ${getHealthColor(testResults.summary.database)}`}>
                    {testResults.summary.database.toUpperCase()}
                  </span>
                  <span className={getHealthBadge(testResults.summary.database)}>
                    {testResults.summary.database}
                  </span>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Authentication</h3>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold ${getHealthColor(testResults.summary.authentication)}`}>
                    {testResults.summary.authentication.toUpperCase()}
                  </span>
                  <span className={getHealthBadge(testResults.summary.authentication)}>
                    {testResults.summary.authentication}
                  </span>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Security</h3>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold ${getHealthColor(testResults.summary.security)}`}>
                    {testResults.summary.security.toUpperCase()}
                  </span>
                  <span className={getHealthBadge(testResults.summary.security)}>
                    {testResults.summary.security}
                  </span>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Models</h3>
                <div className="flex items-center justify-between">
                  <span className={`text-lg font-semibold ${getHealthColor(testResults.summary.models)}`}>
                    {testResults.summary.models.toUpperCase()}
                  </span>
                  <span className={getHealthBadge(testResults.summary.models)}>
                    {testResults.summary.models}
                  </span>
                </div>
              </div>
            </div>

            {/* Overall Status */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Test Results</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.overallStatus)}
                  <span className={`font-medium ${
                    testResults.overallStatus === 'passed' ? 'text-green-400' :
                    testResults.overallStatus === 'warning' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {testResults.overallStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{testResults.totalTests}</div>
                  <div className="text-sm text-gray-400">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{testResults.passedTests}</div>
                  <div className="text-sm text-gray-400">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{testResults.failedTests}</div>
                  <div className="text-sm text-gray-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{testResults.warningTests}</div>
                  <div className="text-sm text-gray-400">Warnings</div>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                Completed in {testResults.duration}ms
              </div>
            </div>

            {/* Detailed Results */}
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Detailed Results</h3>
              <div className="space-y-3">
                {testResults.results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700"
                  >
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-white">{result.name}</h4>
                        <span className="text-sm text-gray-400">{result.duration}ms</span>
                      </div>
                      {result.details && (
                        <p className="text-sm text-gray-300">{result.details}</p>
                      )}
                      {result.error && (
                        <p className="text-sm text-red-400">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isRunning && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-white mb-2">Running System Tests</h3>
              <p className="text-gray-400">
                Testing database connectivity, security models, and system integrations...
              </p>
            </div>
          </div>
        )}
      </div>
    </DeveloperLayout>
  );
}
