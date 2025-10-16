/**
 * Database-backed feature flag provider
 * Fetches feature flags from API and provides them via React Context
 */
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type FeatureFlags = Record<string, boolean>;

type FeatureFlagContextType = {
  flags: FeatureFlags;
  isLoading: boolean;
  refetch: () => Promise<void>;
};

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: {},
  isLoading: true,
  refetch: async () => {},
});

export type FeatureFlagProviderProps = {
  children: React.ReactNode;
  /**
   * API endpoint to fetch feature flags from
   * Should return JSON: { flags: Record<string, boolean> }
   */
  apiEndpoint?: string;
  /**
   * Initial flags (for SSR or testing)
   */
  initialFlags?: FeatureFlags;
  /**
   * Polling interval in milliseconds (0 to disable)
   */
  pollInterval?: number;
};

export function FeatureFlagProvider({
  children,
  apiEndpoint = '/api/feature-flags',
  initialFlags = {},
  pollInterval = 60000, // 1 minute default
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<FeatureFlags>(initialFlags);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const response = await fetch(apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        setFlags(data.flags || {});
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();

    if (pollInterval > 0) {
      const interval = setInterval(fetchFlags, pollInterval);
      return () => clearInterval(interval);
    }
  }, [apiEndpoint, pollInterval]);

  return (
    <FeatureFlagContext.Provider value={{ flags, isLoading, refetch: fetchFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flags from context
 */
export function useFeatureFlagContext() {
  return useContext(FeatureFlagContext);
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(key: string, defaultValue = false): boolean {
  const { flags, isLoading } = useFeatureFlagContext();
  
  if (isLoading) {
    return defaultValue;
  }
  
  return flags[key] ?? defaultValue;
}

/**
 * Component to conditionally render based on feature flag
 */
export type FeatureToggleProps = {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function FeatureToggle({ feature, children, fallback = null }: FeatureToggleProps) {
  const enabled = useFeatureFlag(feature);
  return <>{enabled ? children : fallback}</>;
}

