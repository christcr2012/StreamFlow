// src/pages/dev/ai-lab.tsx

/**
 * 🤖 AI DEVELOPMENT LAB
 * 
 * Advanced AI development and experimentation tools for developers.
 * Provides comprehensive AI model management, testing, and optimization.
 * 
 * FEATURES:
 * - AI model testing and validation
 * - Token usage optimization
 * - Cost analysis and budgeting
 * - Performance benchmarking
 * - A/B testing for AI features
 * - Model fine-tuning interface
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DeveloperLayout from '@/components/DeveloperLayout';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  status: 'active' | 'testing' | 'deprecated';
  tokensUsed: number;
  costPerToken: number;
  accuracy: number;
  latency: number;
  lastUsed: string;
}

interface AIExperiment {
  id: string;
  name: string;
  description: string;
  model: string;
  status: 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  results?: any;
}

export default function AILabPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('models');
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);

  // Fetch AI models and experiments
  const { data: modelsData } = useSWR('/api/dev/ai/models', fetcher);
  const { data: experimentsData } = useSWR('/api/dev/ai/experiments', fetcher);
  const { data: metricsData } = useSWR('/api/dev/ai/metrics', fetcher);

  const models: AIModel[] = modelsData?.models || [];
  const experiments: AIExperiment[] = experimentsData?.experiments || [];

  const runModelTest = async () => {
    if (!selectedModel || !testPrompt) return;

    setIsRunningTest(true);
    try {
      const response = await fetch('/api/dev/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModel,
          prompt: testPrompt,
          includeMetrics: true
        })
      });

      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      console.error('Model test failed:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  const createExperiment = async (experimentData: any) => {
    try {
      const response = await fetch('/api/dev/ai/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(experimentData)
      });

      if (response.ok) {
        // Refresh experiments data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to create experiment:', error);
    }
  };

  return (
    <DeveloperLayout title="AI Development Lab">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              🤖 AI Development Lab
            </h1>
            <p className="text-slate-400 mt-2">
              Advanced AI model development and experimentation
            </p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => createExperiment({
                name: 'New Experiment',
                description: 'AI model performance test',
                model: selectedModel || models[0]?.id
              })}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
            >
              New Experiment
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-green-500/20">
          <nav className="flex space-x-8">
            {[
              { id: 'models', label: 'AI Models', icon: '🤖' },
              { id: 'testing', label: 'Model Testing', icon: '🧪' },
              { id: 'experiments', label: 'Experiments', icon: '⚗️' },
              { id: 'optimization', label: 'Optimization', icon: '⚡' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium transition-all duration-300 border-b-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-400'
                    : 'border-transparent text-slate-400 hover:text-green-400'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* AI Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
              <h2 className="text-xl font-semibold text-white mb-6">AI Model Registry</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-300">Model</th>
                      <th className="text-left py-3 px-4 text-slate-300">Provider</th>
                      <th className="text-left py-3 px-4 text-slate-300">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300">Tokens Used</th>
                      <th className="text-left py-3 px-4 text-slate-300">Accuracy</th>
                      <th className="text-left py-3 px-4 text-slate-300">Latency</th>
                      <th className="text-left py-3 px-4 text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((model) => (
                      <tr key={model.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-4 px-4">
                          <div className="font-medium text-white">{model.name}</div>
                          <div className="text-sm text-slate-400">{model.id}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-sm capitalize">
                            {model.provider}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded text-sm ${
                            model.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            model.status === 'testing' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {model.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {model.tokensUsed.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {(model.accuracy * 100).toFixed(1)}%
                        </td>
                        <td className="py-4 px-4 text-slate-300">
                          {model.latency}ms
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setSelectedModel(model.id)}
                            className="px-3 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm"
                          >
                            Test
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Model Testing Tab */}
        {activeTab === 'testing' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Model Testing Interface</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Test Configuration */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Select Model
                    </label>
                    <select
                      value={selectedModel || ''}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                    >
                      <option value="">Choose a model...</option>
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} ({model.provider})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Test Prompt
                    </label>
                    <textarea
                      value={testPrompt}
                      onChange={(e) => setTestPrompt(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
                      placeholder="Enter your test prompt here..."
                    />
                  </div>

                  <button
                    onClick={runModelTest}
                    disabled={!selectedModel || !testPrompt || isRunningTest}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRunningTest ? 'Running Test...' : 'Run Test'}
                  </button>
                </div>

                {/* Test Results */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Test Results</h3>
                  {testResults ? (
                    <div className="space-y-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="font-medium text-green-400 mb-2">Response</h4>
                        <p className="text-slate-300 text-sm">{testResults.response}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <h4 className="font-medium text-green-400 mb-1">Tokens Used</h4>
                          <p className="text-white text-lg">{testResults.tokensUsed}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <h4 className="font-medium text-green-400 mb-1">Response Time</h4>
                          <p className="text-white text-lg">{testResults.responseTime}ms</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <h4 className="font-medium text-green-400 mb-1">Cost</h4>
                          <p className="text-white text-lg">${testResults.cost?.toFixed(4)}</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-4">
                          <h4 className="font-medium text-green-400 mb-1">Quality Score</h4>
                          <p className="text-white text-lg">{testResults.qualityScore}/10</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 rounded-lg p-8 text-center">
                      <div className="text-4xl mb-4">🧪</div>
                      <p className="text-slate-400">Run a test to see results here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs placeholder */}
        {activeTab !== 'models' && activeTab !== 'testing' && (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8 text-center">
            <div className="text-4xl mb-4">🚧</div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {activeTab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Tools
            </h3>
            <p className="text-slate-400">Advanced AI development tools coming soon...</p>
          </div>
        )}
      </div>
    </DeveloperLayout>
  );
}
