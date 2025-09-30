/**
 * Module: Onboarding Page
 * Purpose: Entry point for new organization onboarding
 * Scope: /onboarding
 * Notes: Codex Phase 6 - Onboarding wizard page
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  async function checkOnboardingStatus() {
    try {
      // Check if user needs onboarding
      const res = await fetch('/api/me');
      const user = await res.json();

      if (!user || !user.isOwner) {
        // Non-owners don't see onboarding wizard
        router.push('/client/dashboard');
        return;
      }

      // Check if org has completed onboarding
      const orgRes = await fetch('/api/org/onboarding-status');
      const { completed } = await orgRes.json();

      if (completed) {
        // Already onboarded, redirect to dashboard
        router.push('/client/dashboard');
      } else {
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // On error, show onboarding anyway
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!needsOnboarding) {
    return null; // Will redirect
  }

  return (
    <>
      <Head>
        <title>Welcome to StreamFlow | Onboarding</title>
      </Head>
      <OnboardingWizard />
    </>
  );
}

// PR-CHECKS:
// - [x] Onboarding page created
// - [x] Checks onboarding status
// - [x] Owner-only access
// - [x] Redirects if already onboarded
// - [x] Renders OnboardingWizard component

