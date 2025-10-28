/**
 * ISR Revalidation Configuration
 * 
 * Centralized configuration for Incremental Static Regeneration (ISR) revalidation times.
 * Tuned based on data freshness requirements for each page type.
 * 
 * Usage:
 *   import { ISR_REVALIDATION } from '@/config/isr-revalidation';
 *   export const revalidate = ISR_REVALIDATION.DASHBOARD;
 */

export const ISR_REVALIDATION = {
  /**
   * Dashboard - 2 minutes
   * High-level metrics that users check frequently
   * Balance between freshness and performance
   */
  DASHBOARD: 120,

  /**
   * Customers List - 5 minutes
   * Customer data doesn't change very frequently
   * Can tolerate slightly stale data
   */
  CUSTOMERS: 300,

  /**
   * Jobs List - 3 minutes
   * Job status changes moderately frequently
   * Users expect relatively fresh data
   */
  JOBS: 180,

  /**
   * Invoices List - 10 minutes
   * Invoices are generated nightly
   * Can tolerate longer cache times
   */
  INVOICES: 600,

  /**
   * Agreements List - 15 minutes
   * Agreements rarely change
   * Can use longer cache times
   */
  AGREEMENTS: 900,

  /**
   * Analytics Pages - 5 minutes
   * Analytics data is pre-computed in materialized views
   * Views are refreshed hourly, so 5 min cache is fine
   */
  ANALYTICS: 300,

  /**
   * Settings Pages - 30 minutes
   * Settings change infrequently
   * Can use very long cache times
   */
  SETTINGS: 1800,

  /**
   * Reports - 10 minutes
   * Reports are typically viewed less frequently
   * Can tolerate longer cache times
   */
  REPORTS: 600,

  /**
   * Calendar/Schedule - 2 minutes
   * Schedule changes frequently
   * Users expect fresh data
   */
  SCHEDULE: 120,

  /**
   * Dispatch Board - 1 minute
   * Real-time-ish updates needed
   * Shortest cache time for operational pages
   */
  DISPATCH: 60,

  /**
   * Public Pages - 1 hour
   * Marketing/public pages change rarely
   * Can use very long cache times
   */
  PUBLIC: 3600,
} as const;

/**
 * On-Demand Revalidation Tags
 * 
 * Use these tags with Next.js revalidateTag() for on-demand revalidation
 * when critical data changes.
 * 
 * Example:
 *   import { revalidateTag } from 'next/cache';
 *   revalidateTag(REVALIDATION_TAGS.JOBS);
 */
export const REVALIDATION_TAGS = {
  DASHBOARD: 'dashboard',
  CUSTOMERS: 'customers',
  JOBS: 'jobs',
  INVOICES: 'invoices',
  AGREEMENTS: 'agreements',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  SCHEDULE: 'schedule',
  DISPATCH: 'dispatch',
} as const;

/**
 * Helper function to get revalidation time for a page type
 */
export function getRevalidationTime(pageType: keyof typeof ISR_REVALIDATION): number {
  return ISR_REVALIDATION[pageType];
}

/**
 * Helper function to determine if a page should use ISR
 * Some pages may be better suited for dynamic rendering
 */
export function shouldUseISR(pageType: string): boolean {
  // Pages that should NOT use ISR (always dynamic)
  const dynamicPages = [
    'checkout',
    'payment',
    'auth',
    'api',
  ];

  return !dynamicPages.some(page => pageType.toLowerCase().includes(page));
}

