'use client';

import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { AIFeatureBadge } from '@/components/ai/AIFeatureBadge';

interface AISettingsClientProps {
  orgId: string;
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'analysis' | 'generation' | 'automation';
}

const AI_FEATURES: Omit<AIFeature, 'enabled'>[] = [
  {
    id: 'lead-scoring',
    name: 'Lead Quality Scoring',
    description: 'Automatically analyze and score leads based on quality indicators, helping you prioritize high-value opportunities.',
    category: 'analysis',
  },
  {
    id: 'rfp-analysis',
    name: 'RFP Analysis',
    description: 'Analyze RFPs and government contracts to provide bidding recommendations and pricing insights.',
    category: 'analysis',
  },
  {
    id: 'email-response',
    name: 'Email Response Generation',
    description: 'Generate professional email responses to customer inquiries using AI.',
    category: 'generation',
  },
  {
    id: 'csv-mapping',
    name: 'CSV Field Mapping Assistant',
    description: 'Automatically suggest field mappings when importing CSV files.',
    category: 'automation',
  },
];

export function AISettingsClient({ orgId }: AISettingsClientProps) {
  const [features, setFeatures] = useState<AIFeature[]>(
    AI_FEATURES.map(f => ({ ...f, enabled: true })) // Default all enabled
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleToggle = async (featureId: string) => {
    const updatedFeatures = features.map(f =>
      f.id === featureId ? { ...f, enabled: !f.enabled } : f
    );
    setFeatures(updatedFeatures);

    // Save to backend
    setSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          features: updatedFeatures.reduce((acc, f) => ({
            ...acc,
            [f.id]: f.enabled,
          }), {}),
        }),
      });

      if (!response.ok) throw new Error('Failed to save settings');

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving AI settings:', error);
      setSaveStatus('error');
      // Revert the change
      setFeatures(features);
    } finally {
      setSaving(false);
    }
  };

  const groupedFeatures = {
    analysis: features.filter(f => f.category === 'analysis'),
    generation: features.filter(f => f.category === 'generation'),
    automation: features.filter(f => f.category === 'automation'),
  };

  return (
    <div className="space-y-8">
      {/* OpenAI Disclosure */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              About AI Features
            </h2>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Cortiware uses OpenAI's artificial intelligence technology to provide intelligent features that help you work more efficiently. 
              When you use AI features, your data is sent to OpenAI for processing.
            </p>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Data Usage:</strong> Input data sent to AI features may be used by OpenAI to improve their services.</p>
              <p><strong>Privacy:</strong> We do not share personally identifiable information beyond what's necessary for the feature to function.</p>
              <p><strong>Control:</strong> You can disable any AI feature at any time using the toggles below.</p>
            </div>
            <div className="mt-4">
              <a 
                href="https://openai.com/policies/privacy-policy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-700 dark:text-blue-300 hover:underline font-medium"
              >
                Read OpenAI's Privacy Policy ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Save Status */}
      {saveStatus !== 'idle' && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          saveStatus === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          {saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Settings saved successfully</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Failed to save settings. Please try again.</span>
            </>
          )}
        </div>
      )}

      {/* Analysis Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Analysis & Insights
        </h3>
        <div className="space-y-4">
          {groupedFeatures.analysis.map(feature => (
            <FeatureToggle
              key={feature.id}
              feature={feature}
              onToggle={handleToggle}
              disabled={saving}
            />
          ))}
        </div>
      </div>

      {/* Generation Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Content Generation
        </h3>
        <div className="space-y-4">
          {groupedFeatures.generation.map(feature => (
            <FeatureToggle
              key={feature.id}
              feature={feature}
              onToggle={handleToggle}
              disabled={saving}
            />
          ))}
        </div>
      </div>

      {/* Automation Features */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Automation & Assistance
        </h3>
        <div className="space-y-4">
          {groupedFeatures.automation.map(feature => (
            <FeatureToggle
              key={feature.id}
              feature={feature}
              onToggle={handleToggle}
              disabled={saving}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureToggle({ 
  feature, 
  onToggle, 
  disabled 
}: { 
  feature: AIFeature; 
  onToggle: (id: string) => void; 
  disabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {feature.name}
          </h4>
          <AIFeatureBadge size="sm" />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {feature.description}
        </p>
      </div>
      <button
        onClick={() => onToggle(feature.id)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          feature.enabled 
            ? 'bg-blue-600' 
            : 'bg-gray-200 dark:bg-gray-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        role="switch"
        aria-checked={feature.enabled}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            feature.enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

