'use client';

import { useState } from 'react';
import { Info, X } from 'lucide-react';
import Link from 'next/link';

interface AIDisclosureBannerProps {
  featureName: string;
  onDismiss?: () => void;
  showOnce?: boolean; // If true, uses localStorage to show only once
  storageKey?: string; // Custom storage key for showOnce
}

/**
 * AI Disclosure Banner Component
 * 
 * Displays disclosure about AI data usage to comply with OpenAI's usage policies.
 * Required for all AI-powered features per OpenAI Content Sharing Agreement.
 * 
 * Features:
 * - Explains how data is used with OpenAI
 * - Links to privacy policy and opt-out settings
 * - Can be dismissed (optionally persisted to localStorage)
 */
export function AIDisclosureBanner({ 
  featureName, 
  onDismiss,
  showOnce = false,
  storageKey,
}: AIDisclosureBannerProps) {
  const defaultStorageKey = `ai-disclosure-dismissed-${featureName.toLowerCase().replace(/\s+/g, '-')}`;
  const key = storageKey || defaultStorageKey;

  // Check if banner was previously dismissed
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined' || !showOnce) return false;
    return localStorage.getItem(key) === 'true';
  });

  const handleDismiss = () => {
    if (showOnce && typeof window !== 'undefined') {
      localStorage.setItem(key, 'true');
    }
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
            AI-Powered Feature
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
            This {featureName} feature uses OpenAI's artificial intelligence technology. 
            When you use this feature, your input data is sent to OpenAI for processing and may be used to improve their services.
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <Link 
              href="/settings/privacy" 
              className="text-blue-700 dark:text-blue-300 hover:underline font-medium"
            >
              Privacy Settings
            </Link>
            <Link 
              href="/settings/ai" 
              className="text-blue-700 dark:text-blue-300 hover:underline font-medium"
            >
              Manage AI Features
            </Link>
            <a 
              href="https://openai.com/policies/privacy-policy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-700 dark:text-blue-300 hover:underline font-medium"
            >
              OpenAI Privacy Policy ↗
            </a>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

