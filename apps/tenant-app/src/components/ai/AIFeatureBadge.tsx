'use client';

import { Sparkles } from 'lucide-react';

interface AIFeatureBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * AI Feature Badge Component
 * 
 * Displays "Powered by OpenAI" badge to comply with OpenAI's usage policies.
 * Required for all AI-powered features per OpenAI Content Sharing Agreement.
 */
export function AIFeatureBadge({ className = '', size = 'md' }: AIFeatureBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 font-medium ${sizeClasses[size]} ${className}`}
      title="This feature uses OpenAI's AI technology"
    >
      <Sparkles size={iconSizes[size]} className="text-purple-600 dark:text-purple-400" />
      <span>Powered by OpenAI</span>
    </div>
  );
}

