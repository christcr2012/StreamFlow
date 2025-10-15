// Provider Subscriptions Service
// Server-only service for subscription management, MRR/ARR, and churn analysis

import { prisma } from '@/lib/prisma';
import type { Subscription } from '@prisma/client-provider';

export type SubscriptionSummary = {
  totalActive: number;
  totalTrialing: number;
  totalCanceled: number;
  mrrCents: number; // Monthly Recurring Revenue
  arrCents: number; // Annual Recurring Revenue
  churnRate: number; // Percentage
};

export type SubscriptionListItem = {
  id: string;
  orgId: string;
  orgName: string;
  plan: string;
  status: string;
  startedAt: string;
  canceledAt: string | null;
  renewsAt: string | null;
  priceCents: number;
  meta: any;
};

export type SubscriptionDetail = SubscriptionListItem & {
  createdAt: string;
  updatedAt: string;
};

/**
 * Get subscription summary with MRR/ARR and churn metrics
 */
export async function getSubscriptionSummary(): Promise<SubscriptionSummary> {
  const [active, trialing, canceled, allActive] = await Promise.all([
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.count({ where: { status: 'trialing' } }),
    prisma.subscription.count({ where: { status: 'canceled' } }),
    prisma.subscription.findMany({
      where: { status: 'active' },
      select: { priceCents: true },
    }),
  ]);

  // Calculate MRR (sum of all active subscription prices)
  const mrrCents = allActive.reduce((sum: any, sub: any) => sum + sub.priceCents, 0);
  const arrCents = mrrCents * 12;

  // Calculate churn rate (canceled / total)
  const total = active + trialing + canceled;
  const churnRate = total > 0 ? (canceled / total) * 100 : 0;

  return {
    totalActive: active,
    totalTrialing: trialing,
    totalCanceled: canceled,
    mrrCents,
    arrCents,
    churnRate: Math.round(churnRate * 100) / 100, // Round to 2 decimals
  };
}

/**
 * List subscriptions with pagination and filtering
 */
export async function listSubscriptions(params: {
  cursor?: string;
  limit?: number;
  status?: string;
  orgId?: string;
}): Promise<{ items: SubscriptionListItem[]; nextCursor: string | null }> {
  const { cursor, limit = 20, status, orgId } = params;

  const where: any = {};
  if (status) where.status = status;
  if (orgId) where.orgId = orgId;

  const subs = await prisma.subscription.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  const hasMore = subs.length > limit;
  const items = hasMore ? subs.slice(0, limit) : subs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return {
    items: items.map((sub: any) => ({
      id: sub.id,
      orgId: sub.orgId,
      orgName: sub.org.name,
      plan: sub.plan,
      status: sub.status,
      startedAt: sub.startedAt.toISOString(),
      canceledAt: sub.canceledAt?.toISOString() || null,
      renewsAt: sub.renewsAt?.toISOString() || null,
      priceCents: sub.priceCents,
      meta: sub.meta,
    })),
    nextCursor,
  };
}

/**
 * Get subscription detail by ID
 */
export async function getSubscriptionDetail(id: string): Promise<SubscriptionDetail | null> {
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  if (!sub) return null;

  return {
    id: sub.id,
    orgId: sub.orgId,
    orgName: sub.org.name,
    plan: sub.plan,
    status: sub.status,
    startedAt: sub.startedAt.toISOString(),
    canceledAt: sub.canceledAt?.toISOString() || null,
    renewsAt: sub.renewsAt?.toISOString() || null,
    priceCents: sub.priceCents,
    meta: sub.meta,
    createdAt: sub.createdAt.toISOString(),
    updatedAt: sub.updatedAt.toISOString(),
  };
}

/**
 * Get plan change history for an organization
 */
export async function getPlanChangeHistory(orgId: string): Promise<SubscriptionListItem[]> {
  const subs = await prisma.subscription.findMany({
    where: { orgId },
    orderBy: [{ createdAt: 'desc' }],
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  return subs.map((sub: any) => ({
    id: sub.id,
    orgId: sub.orgId,
    orgName: sub.org.name,
    plan: sub.plan,
    status: sub.status,
    startedAt: sub.startedAt.toISOString(),
    canceledAt: sub.canceledAt?.toISOString() || null,
    renewsAt: sub.renewsAt?.toISOString() || null,
    priceCents: sub.priceCents,
    meta: sub.meta,
  }));
}

/**
 * Get upcoming renewals (next 30 days)
 */
export async function getUpcomingRenewals(): Promise<SubscriptionListItem[]> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subs = await prisma.subscription.findMany({
    where: {
      status: 'active',
      renewsAt: {
        gte: now,
        lte: thirtyDaysFromNow,
      },
    },
    orderBy: [{ renewsAt: 'asc' }],
    include: {
      org: {
        select: { id: true, name: true },
      },
    },
  });

  return subs.map((sub: any) => ({
    id: sub.id,
    orgId: sub.orgId,
    orgName: sub.org.name,
    plan: sub.plan,
    status: sub.status,
    startedAt: sub.startedAt.toISOString(),
    canceledAt: sub.canceledAt?.toISOString() || null,
    renewsAt: sub.renewsAt?.toISOString() || null,
    priceCents: sub.priceCents,
    meta: sub.meta,
  }));
}

