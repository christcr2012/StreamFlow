// src/lib/billing.ts
/**
 * Central billing policy for conversion-based billing.
 *
 * Policy:
 *  - Bill only converted, system-generated leads (UNIT_PRICE_CENTS each).
 *  - Referrals are never billable.
 *
 * Your Prisma enum LeadSource does NOT include `REFERRAL`.
 * We therefore classify referrals as:
 *   - MANUAL_EMPLOYEE_REFERRAL
 *   - MANUAL_EXISTING_CUSTOMER
 *   - MANUAL_NEW_CUSTOMER
 * And, defensively, any *string* containing "referral" is treated as referral.
 */

import { LeadSource } from "@prisma/client";

// Flat price — Phase 2 policy
export const UNIT_PRICE_CENTS = 10000; // $100

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
