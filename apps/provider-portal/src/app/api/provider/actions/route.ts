/**
 * Provider Action Center API
 * 
 * GET /api/provider/actions - Get all pending actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getProviderSession } from '@/lib/api/withProviderAuth';

interface ActionItem {
  id: string;
  type: 'approval' | 'alert' | 'task' | 'review';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  orgName?: string;
  createdAt: string;
  dueDate?: string;
  actionUrl?: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = getProviderSession(request);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actions: ActionItem[] = [];

    // 1. Pending onboarding invites (approvals)
    const pendingInvites = await prisma.onboardingInvite.count({
      where: { usedAt: null }
    });

    if (pendingInvites > 0) {
      actions.push({
        id: 'pending-invites',
        type: 'review',
        priority: 'medium',
        title: `${pendingInvites} Pending Onboarding Invites`,
        description: 'Review and manage pending tenant onboarding invitations',
        createdAt: new Date().toISOString(),
        actionUrl: '/provider/tenants'
      });
    }

    // 2. Orgs without active subscriptions (alerts)
    const orgsWithoutSubs = await prisma.org.findMany({
      where: {
        subscriptions: {
          none: {
            status: 'active'
          }
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      take: 10
    });

    orgsWithoutSubs.forEach(org => {
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(org.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation > 7) {
        actions.push({
          id: `no-sub-${org.id}`,
          type: 'alert',
          priority: 'high',
          title: 'No Active Subscription',
          description: `${org.name} has been active for ${daysSinceCreation} days without a subscription`,
          orgName: org.name,
          createdAt: org.createdAt.toISOString(),
          actionUrl: `/provider/tenants/${org.id}`
        });
      }
    });

    // 3. Failed payment intents (alerts)
    const failedPayments = await prisma.activity.findMany({
      where: {
        action: 'payment_failed',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        orgId: true,
        createdAt: true,
        meta: true
      },
      take: 10
    });

    for (const payment of failedPayments) {
      const org = await prisma.org.findUnique({
        where: { id: payment.orgId },
        select: { name: true }
      });

      if (org) {
        actions.push({
          id: `failed-payment-${payment.id}`,
          type: 'alert',
          priority: 'high',
          title: 'Payment Failed',
          description: `Payment failed for ${org.name}`,
          orgName: org.name,
          createdAt: payment.createdAt.toISOString(),
          actionUrl: `/provider/billing`
        });
      }
    }

    // 4. High usage orgs (review)
    const highUsageOrgs = await prisma.org.findMany({
      where: {
        subscriptions: {
          some: {
            status: 'active'
          }
        }
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      },
      take: 5
    });

    // Note: In production, you'd calculate actual usage from metrics
    // For now, we'll create placeholder review items
    highUsageOrgs.forEach(org => {
      actions.push({
        id: `usage-review-${org.id}`,
        type: 'review',
        priority: 'low',
        title: 'Usage Review',
        description: `Review usage patterns for ${org.name}`,
        orgName: org.name,
        createdAt: new Date().toISOString(),
        actionUrl: `/provider/analytics`
      });
    });

    // 5. Unconfigured integrations (tasks)
    const config = await prisma.providerConfig.findFirst({
      select: {
        stripeSecretKey: true,
        samApiKey: true
      }
    });

    if (!config?.stripeSecretKey) {
      actions.push({
        id: 'configure-stripe',
        type: 'task',
        priority: 'high',
        title: 'Configure Stripe Integration',
        description: 'Set up Stripe API keys to enable billing functionality',
        createdAt: new Date().toISOString(),
        actionUrl: '/provider/settings'
      });
    }

    if (!config?.samApiKey) {
      actions.push({
        id: 'configure-samgov',
        type: 'task',
        priority: 'medium',
        title: 'Configure SAM.gov Integration',
        description: 'Set up SAM.gov API key to enable government contract lead generation',
        createdAt: new Date().toISOString(),
        actionUrl: '/provider/settings'
      });
    }

    // Sort by priority and date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ actions });
  } catch (error) {
    console.error('Error fetching actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}

