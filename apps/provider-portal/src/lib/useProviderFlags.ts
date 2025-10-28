'use client';

import { useEffect, useState } from 'react';

export type ProviderFlags = Record<string, unknown>;

export function useProviderFlags() {
  const [flags, setFlags] = useState<ProviderFlags | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/api/feature-flags')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('failed')))
      .then((j) => {
        if (!isMounted) return;
        setFlags(j.flags || {});
      })
      .catch(() => {
        if (!isMounted) return;
        setFlags({});
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return { flags, loading };
}
