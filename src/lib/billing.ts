// src/lib/billing.ts
/**
 * Central billing policy for conversion-based billing.
 *
 * CURRENT IMPLEMENTATION: Basic flat-rate billing
 * Policy:
 *  - Bill only converted, system-generated leads (UNIT_PRICE_CENTS each).
 *  - Referrals are never billable.
 *
 * 📊 BILLING VENDOR COMPARISON MATRIX:
 * ====================================
 * 
 * CAPABILITY ASSESSMENT (1-5 scale, 5 = best):
 * 
 * | Feature                    | Zuora | Chargebee | Recurly | Stripe-Native |
 * |---------------------------|-------|-----------|---------|---------------|
 * | Subscription Lifecycle    |   5   |     4     |    4    |       3       |
 * | Proration Logic          |   5   |     5     |    4    |       3       |
 * | Usage Metering           |   5   |     4     |    3    |       4       |
 * | Multi-Currency          |   5   |     4     |    4    |       5       |
 * | Tax Compliance          |   4   |     5     |    3    |       5       |
 * | Revenue Recognition     |   5   |     4     |    4    |       2       |
 * | Accounting Exports      |   5   |     4     |    4    |       3       |
 * | API Quality            |   4   |     4     |    4    |       5       |
 * | Developer Experience   |   3   |     4     |    4    |       5       |
 * | Implementation Speed   |   2   |     3     |    3    |       5       |
 * | Total Cost (5yr)       |   2   |     3     |    3    |       4       |
 * 
 * RECOMMENDATION: Stripe-Native + Custom Revenue Recognition
 * - Best for Phase 1 implementation (fastest time-to-market)
 * - Excellent API quality and developer experience
 * - Strong multi-currency and tax capabilities
 * - Cost-effective for current scale
 * - Can be extended with custom revenue recognition logic
 * 
 * 🚀 PHASE 1 IMPLEMENTATION BLUEPRINT (Sprints 1-2):
 * =====================================================
 * 
 * SPRINT 1 (Week 1-2): Core Subscription Infrastructure
 * 
 * 1. DATABASE SCHEMA CHANGES:
 *    - Add PricingPlan table with tiered plans
 *    - Add SubscriptionProduct table for Stripe product mapping
 *    - Add SubscriptionPrice table for Stripe price mapping
 *    - Add OrganizationSubscription table for current subscriptions
 *    - Add UsageRecord table for metering and billing
 *    - Migration scripts with rollback procedures
 * 
 * 2. STRIPE OBJECT MAPPING:
 *    - Product: 'robinson-lead-generation' (our service)
 *    - Prices: tier-based recurring prices + usage-based pricing
 *    - Subscriptions: map to OrganizationSubscription
 *    - UsageRecords: track lead processing, API calls, storage
 *    - Customers: enhance existing org->customer mapping
 * 
 * 3. API CONTRACTS:
 *    POST /api/billing/subscriptions/create
 *    PUT  /api/billing/subscriptions/{id}/change-plan
 *    POST /api/billing/subscriptions/{id}/usage
 *    GET  /api/billing/subscriptions/{id}/preview
 *    DELETE /api/billing/subscriptions/{id}/cancel
 * 
 * SPRINT 2 (Week 3-4): Usage Metering & Webhooks
 * 
 * 1. USAGE METERING SYSTEM:
 *    - Real-time usage tracking for leads, API calls, storage
 *    - Daily/monthly aggregation jobs
 *    - Usage limit enforcement and notifications
 *    - Overage billing calculation
 * 
 * 2. WEBHOOK-TO-QUEUE ARCHITECTURE:
 *    - Implement Redis queue for webhook processing
 *    - Idempotency using event IDs and database deduplication
 *    - Retry logic with exponential backoff
 *    - Dead letter queue for failed events
 *    - Webhook signature verification hardening
 * 
 * 3. REVENUE RECOGNITION BASICS:
 *    - Deferred revenue calculation for annual plans
 *    - Monthly revenue recognition for usage charges
 *    - Basic MRR/ARR reporting
 * 
 * 🔧 TECHNICAL IMPLEMENTATION DETAILS:
 * =====================================
 *
 * Your Prisma enum LeadSource does NOT include `REFERRAL`.
 * We therefore classify referrals as:
 *   - MANUAL_EMPLOYEE_REFERRAL
 *   - MANUAL_EXISTING_CUSTOMER
 *   - MANUAL_NEW_CUSTOMER
 * And, defensively, any *string* containing "referral" is treated as referral.
 */

import { LeadSource } from "@prisma/client";

// 🚨 CURRENT: Flat price — Phase 2 policy (BASIC IMPLEMENTATION)
export const UNIT_PRICE_CENTS = 10000; // $100

/**
 * CONCRETE PRICING ENGINE IMPLEMENTATION:
 * ========================================
 * 
 * Phase 1 data structures (implement immediately):
 */

export interface PricingPlan {
  id: string;
  stripeProductId: string;
  stripePriceId: string;
  name: string;
  tier: 'starter' | 'professional' | 'enterprise';
  basePriceCents: number;
  currency: string;
  interval: 'month' | 'year';
  features: {
    leadsPerMonth: number;
    users: number;
    apiCallsPerMonth: number;
    storageGB: number;
    supportLevel: 'email' | 'priority' | 'dedicated';
  };
  usageOverages: {
    leadCents: number;        // $5.00 per additional lead
    userCents: number;        // $25.00 per additional user
    apiCallCents: number;     // $0.01 per 1000 API calls
    storageCents: number;     // $0.50 per GB
  };
}

export interface UsageRecord {
  orgId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  leadsProcessed: number;
  activeUsers: number;
  apiCallsUsed: number;
  storageUsedGB: number;
}

export interface SubscriptionState {
  orgId: string;
  stripeSubscriptionId: string;
  currentPlan: PricingPlan;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

/**
 * PHASE 1 PRICING ENGINE (implement in Sprint 1):
 */
export class PricingEngine {
  async calculateBill(usage: UsageRecord, plan: PricingPlan): Promise<{
    subscriptionCharge: number;
    usageCharges: {
      leads: number;
      users: number;
      apiCalls: number;
      storage: number;
    };
    totalCents: number;
  }> {
    const usageCharges = {
      leads: Math.max(0, usage.leadsProcessed - plan.features.leadsPerMonth) * plan.usageOverages.leadCents,
      users: Math.max(0, usage.activeUsers - plan.features.users) * plan.usageOverages.userCents,
      apiCalls: Math.max(0, usage.apiCallsUsed - plan.features.apiCallsPerMonth) * plan.usageOverages.apiCallCents,
      storage: Math.max(0, usage.storageUsedGB - plan.features.storageGB) * plan.usageOverages.storageCents,
    };
    
    const totalUsage = Object.values(usageCharges).reduce((sum, charge) => sum + charge, 0);
    
    return {
      subscriptionCharge: plan.basePriceCents,
      usageCharges,
      totalCents: plan.basePriceCents + totalUsage,
    };
  }
}

/**
 * STRIPE PRODUCT CATALOG (Phase 1 Setup):
 * - Product ID: 'robinson-lead-generation'
 * - Price IDs: 'starter-monthly', 'professional-monthly', 'enterprise-monthly'
 * - Usage Prices: 'leads-overage', 'users-overage', 'api-overage', 'storage-overage'
 */

// Bill just SYSTEM-sourced leads
export const BILLABLE_SOURCES: LeadSource[] = [LeadSource.SYSTEM];

// Never bill referrals (map to existing enum members in your schema)
export const REFERRAL_SOURCES: LeadSource[] = [
  LeadSource.MANUAL_EMPLOYEE_REFERRAL,
  LeadSource.MANUAL_EXISTING_CUSTOMER,
  LeadSource.MANUAL_NEW_CUSTOMER,
];

/**
 * Normalize any incoming source value to the Prisma enum, if possible.
 * Accepts common string shapes used in forms/imports ("system", "SYSTEM", etc.).
 */
export function asLeadSource(v: unknown): LeadSource | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;

  // Exact enum key
  if ((LeadSource as any)[s] !== undefined) return (LeadSource as any)[s] as LeadSource;

  // Case-insensitive match on enum keys
  const upper = s.toUpperCase();
  for (const k of Object.keys(LeadSource)) {
    if (k.toUpperCase() === upper) return (LeadSource as any)[k] as LeadSource;
  }
  return null;
}

/**
 * True if the given source is any referral flavor (never billable).
 * - Enum: must be in REFERRAL_SOURCES
 * - String: also treat any value containing "referral" as referral
 */
export function isReferralSource(src: string | LeadSource | null | undefined): boolean {
  if (src == null) return false;

  if (typeof src === "string") {
    if (/referral/i.test(src)) return true;
    const enumVal = asLeadSource(src);
    return enumVal ? REFERRAL_SOURCES.includes(enumVal) : false;
  }

  return REFERRAL_SOURCES.includes(src);
}

/**
 * True only for sources we treat as billable under current policy.
 * (Currently just SYSTEM. RFPs and referrals do not qualify.)
 */
export function isBillableSource(src: string | LeadSource | null | undefined): boolean {
  if (src == null) return false;
  if (isReferralSource(src)) return false;

  const enumVal = typeof src === "string" ? asLeadSource(src) : src;
  if (!enumVal) return false;
  return BILLABLE_SOURCES.includes(enumVal);
}

/**
 * PHASE 1 IMPLEMENTATION CHECKLIST:
 * =================================
 * 
 * Sprint 1 (Database & Core Logic):
 * [ ] Create database migration for subscription tables
 * [ ] Implement PricingEngine class with calculations
 * [ ] Create UsageTracker class for metering
 * [ ] Add feature flag for subscription billing
 * [ ] Write unit tests for pricing calculations
 * 
 * Sprint 2 (Stripe Integration):
 * [ ] Set up Stripe products and prices
 * [ ] Implement subscription creation API
 * [ ] Implement plan change API with proration
 * [ ] Enhance webhook handler for subscription events
 * [ ] Add usage reporting to Stripe
 * 
 * Sprint 3 (Migration & Testing):
 * [ ] Create migration script from old billing system
 * [ ] Implement billing event queue processing
 * [ ] Add monitoring and alerting for billing failures
 * [ ] Load test with high-volume usage scenarios
 * [ ] Create rollback procedures
 * 
 * ACCEPTANCE CRITERIA:
 * ===================
 * 
 * 1. Subscription Management:
 *    ✓ Customers can upgrade/downgrade plans
 *    ✓ Proration is calculated correctly
 *    ✓ Usage overages are billed accurately
 *    ✓ Failed payments trigger dunning workflow
 * 
 * 2. Usage Metering:
 *    ✓ Lead processing is tracked in real-time
 *    ✓ API calls are metered and billed
 *    ✓ Storage usage is calculated monthly
 *    ✓ Usage limits trigger notifications
 * 
 * 3. Revenue Recognition:
 *    ✓ Subscription revenue is recognized monthly
 *    ✓ Usage charges are recognized when incurred
 *    ✓ Refunds and credits are properly accounted
 *    ✓ MRR/ARR reports are accurate
 * 
 * RISK MITIGATION:
 * ================
 * 
 * 1. Data Loss Prevention:
 *    - Run old and new billing in parallel for 60 days
 *    - Daily reconciliation reports
 *    - Automated backup before any migration
 * 
 * 2. Revenue Protection:
 *    - Feature flag allows instant rollback
 *    - Manual invoice generation as backup
 *    - Customer communication plan for any issues
 * 
 * 3. Technical Risks:
 *    - Stripe webhook failures: retry queue with DLQ
 *    - Usage tracking failures: background reconciliation
 *    - Performance issues: database indexes and caching
 */
