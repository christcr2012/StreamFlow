/**
 * 🧪 WEBHOOK TESTING API
 * Send test webhook events to validate endpoint configuration
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth-helpers';
import { webhookSystem, WebhookEvents } from '@/lib/webhook-system';
import { prisma as db } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const user = await requireAuth(req, res);
    if (!user) return;

    const { webhookId, eventType } = req.body;

    if (!webhookId) {
      return res.status(400).json({ error: 'Webhook ID is required' });
    }

    // Verify webhook belongs to organization
    const webhook = await db.webhookEndpoint.findFirst({
      where: { 
        id: webhookId, 
        orgId: user.orgId,
        active: true,
      },
    });

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found or inactive' });
    }

    // Determine event type to test
    const testEventType = eventType || WebhookEvents.LEAD_CREATED;

    // Check if webhook is subscribed to this event type
    if (!webhook.events.includes(testEventType)) {
      return res.status(400).json({ 
        error: `Webhook is not subscribed to ${testEventType} events`,
        subscribedEvents: webhook.events,
      });
    }

    // Generate test event data
    const testEventData = generateTestEventData(testEventType, user.orgId);

    // Send test webhook
    await webhookSystem.sendWebhookEvent({
      type: testEventType,
      data: testEventData,
      orgId: user.orgId,
    });

    return res.status(200).json({
      success: true,
      message: `Test ${testEventType} event sent to webhook`,
      testData: testEventData,
    });

  } catch (error) {
    console.error('Webhook test error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate test event data based on event type
 */
function generateTestEventData(eventType: string, orgId: string): any {
  const baseData = {
    timestamp: new Date().toISOString(),
    orgId,
    test: true,
  };

  switch (eventType) {
    case WebhookEvents.LEAD_CREATED:
      return {
        ...baseData,
        lead: {
          id: 'test-lead-' + Date.now(),
          name: 'Test Lead',
          email: 'test@example.com',
          phone: '+1-555-0123',
          source: 'webhook-test',
          status: 'new',
          score: 85,
          estimatedValue: 5000,
          createdAt: new Date().toISOString(),
        },
      };

    case WebhookEvents.LEAD_UPDATED:
      return {
        ...baseData,
        lead: {
          id: 'test-lead-' + Date.now(),
          name: 'Updated Test Lead',
          email: 'updated@example.com',
          status: 'qualified',
          score: 92,
          estimatedValue: 7500,
          updatedAt: new Date().toISOString(),
        },
        changes: {
          status: { from: 'new', to: 'qualified' },
          score: { from: 85, to: 92 },
          estimatedValue: { from: 5000, to: 7500 },
        },
      };

    case WebhookEvents.LEAD_CONVERTED:
      return {
        ...baseData,
        lead: {
          id: 'test-lead-' + Date.now(),
          name: 'Converted Test Lead',
          email: 'converted@example.com',
          status: 'converted',
          score: 100,
          convertedAt: new Date().toISOString(),
        },
        conversion: {
          value: 10000,
          type: 'sale',
          jobId: 'test-job-' + Date.now(),
        },
      };

    case WebhookEvents.INVOICE_CREATED:
      return {
        ...baseData,
        invoice: {
          id: 'test-invoice-' + Date.now(),
          number: 'INV-TEST-' + Date.now(),
          amount: 2500,
          currency: 'USD',
          status: 'draft',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          customerId: 'test-customer-' + Date.now(),
          createdAt: new Date().toISOString(),
        },
      };

    case WebhookEvents.INVOICE_PAID:
      return {
        ...baseData,
        invoice: {
          id: 'test-invoice-' + Date.now(),
          number: 'INV-TEST-' + Date.now(),
          amount: 2500,
          currency: 'USD',
          status: 'paid',
          paidAt: new Date().toISOString(),
          customerId: 'test-customer-' + Date.now(),
        },
        payment: {
          id: 'test-payment-' + Date.now(),
          amount: 2500,
          method: 'credit_card',
          transactionId: 'txn_test_' + Date.now(),
        },
      };

    case WebhookEvents.USER_CREATED:
      return {
        ...baseData,
        user: {
          id: 'test-user-' + Date.now(),
          email: 'newuser@example.com',
          name: 'Test User',
          role: 'STAFF',
          createdAt: new Date().toISOString(),
        },
      };

    case WebhookEvents.ORGANIZATION_UPDATED:
      return {
        ...baseData,
        organization: {
          id: orgId,
          name: 'Updated Test Organization',
          settings: {
            timezone: 'America/New_York',
            currency: 'USD',
            features: ['leads', 'invoicing', 'reporting'],
          },
          updatedAt: new Date().toISOString(),
        },
        changes: {
          settings: {
            timezone: { from: 'UTC', to: 'America/New_York' },
          },
        },
      };

    default:
      return {
        ...baseData,
        message: `Test event for ${eventType}`,
        data: {
          testProperty: 'test-value',
          timestamp: new Date().toISOString(),
        },
      };
  }
}
