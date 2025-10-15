'use client';

import React, { useState } from 'react';

export interface EmailResponseAssistantProps {
  customerName?: string;
  topic?: string;
  incomingEmail?: string;
  onSuggestionGenerated?: (suggestion: {
    subject: string;
    body: string;
    tone: string;
    confidence: number;
  }) => void;
  className?: string;
}

export function EmailResponseAssistant({
  customerName,
  topic,
  incomingEmail,
  onSuggestionGenerated,
  className = '',
}: EmailResponseAssistantProps) {
  const [tone, setTone] = useState<'professional' | 'friendly' | 'formal'>('professional');
  const [additionalContext, setAdditionalContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    subject: string;
    body: string;
    tone: string;
    confidence: number;
  } | null>(null);

  async function generateResponse() {
    try {
      setGenerating(true);

      const res = await fetch('/api/ai/email-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          topic,
          incomingEmail,
          tone,
          additionalContext,
        }),
      });

      const data = await res.json();

      if (data.ok && data.suggestion) {
        setSuggestion(data.suggestion);
        onSuggestionGenerated?.(data.suggestion);
      } else {
        alert(`Failed to generate response: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Failed to generate response: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Email Response Assistant
        </h3>

        {/* Tone Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Response Tone
          </label>
          <div className="flex gap-2">
            {(['professional', 'friendly', 'formal'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tone === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Context */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional Context (Optional)
          </label>
          <textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Add any additional context or specific points to address..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={generateResponse}
          disabled={generating}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Generate AI Response
            </>
          )}
        </button>
      </div>

      {/* Generated Suggestion */}
      {suggestion && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              AI-Generated Response
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
              <div className="flex items-center gap-1">
                <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      suggestion.confidence >= 0.8
                        ? 'bg-green-600 dark:bg-green-500'
                        : suggestion.confidence >= 0.6
                        ? 'bg-yellow-600 dark:bg-yellow-500'
                        : 'bg-orange-600 dark:bg-orange-500'
                    }`}
                    style={{ width: `${suggestion.confidence * 100}%` }}
                  />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {Math.round(suggestion.confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <button
                onClick={() => copyToClipboard(suggestion.subject)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Copy
              </button>
            </div>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-900 dark:text-gray-100">{suggestion.subject}</p>
            </div>
          </div>

          {/* Body */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Body
              </label>
              <button
                onClick={() => copyToClipboard(suggestion.body)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Copy
              </button>
            </div>
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
              <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap font-sans">
                {suggestion.body}
              </pre>
            </div>
          </div>

          {/* Tone Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Tone:</span>
            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
              {suggestion.tone.charAt(0).toUpperCase() + suggestion.tone.slice(1)}
            </span>
          </div>

          {/* Copy All Button */}
          <button
            onClick={() => copyToClipboard(`Subject: ${suggestion.subject}\n\n${suggestion.body}`)}
            className="w-full mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
          >
            Copy Complete Email
          </button>
        </div>
      )}
    </div>
  );
}

