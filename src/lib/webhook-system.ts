/**
 * 🔔 ENTERPRISE WEBHOOK SYSTEM
 * Comprehensive real-time event notification system for client integrations
 */

import crypto from 'crypto';
import { prisma as db } from './prisma';
import { createAuditEvent, AuditContext, AuditEventData } from './audit';
import type { NextApiRequest } from 'next';

export interface WebhookEndpoint {
  id: string;
  orgId: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastDeliveryAt?: Date;
  failureCount: number;
  maxRetries: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  orgId: string;
  timestamp: Date;
  signature?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookEndpointId: string;
  eventId: string;
  status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'RETRYING';
  httpStatus?: number;
  responseBody?: string;
  attemptCount: number;
  nextRetryAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
}

/**
 * Helper function for webhook audit logging
 */
async function auditWebhookAction(
  action: string,
  target: string,
  orgId: string,
  details?: Record<string, any>
): Promise<void> {
  await createAuditEvent(
    {
      userId: 'system',
      orgId,
    },
    {
      action,
      target,
      category: 'ADMIN_ACTION',
      details,
    }
  );
}

/**
 * Enterprise Webhook Management System
 */
export class WebhookSystem {
  /**
   * Register a new webhook endpoint for an organization
   */
  async registerWebhook(orgId: string, url: string, events: string[]): Promise<WebhookEndpoint> {
    // Generate secure webhook secret
    const secret = this.generateWebhookSecret();
    
    // Validate URL format
    if (!this.isValidWebhookUrl(url)) {
      throw new Error('Invalid webhook URL format');
    }

    // Create webhook endpoint
    const webhook = await db.webhookEndpoint.create({
      data: {
        orgId,
        url,
        secret,
        events,
        active: true,
        failureCount: 0,
        maxRetries: 5,
      },
    });

    // Audit log
    await auditWebhookAction(
      'webhook.registered',
      `webhook:${webhook.id}`,
      orgId,
      {
        webhookUrl: url,
        events,
      }
    );

    return webhook as WebhookEndpoint;
  }

  /**
   * Send webhook event to all registered endpoints
   */
  async sendWebhookEvent(event: Omit<WebhookEvent, 'id' | 'timestamp' | 'signature'>): Promise<void> {
    // Get all active webhook endpoints for this organization
    const webhooks = await db.webhookEndpoint.findMany({
      where: {
        orgId: event.orgId,
        active: true,
        events: {
          has: event.type,
        },
      },
    });

    if (webhooks.length === 0) {
      console.log(`No webhook endpoints registered for event ${event.type} in org ${event.orgId}`);
      return;
    }

    // Create webhook event record
    const webhookEvent = await db.webhookEvent.create({
      data: {
        type: event.type,
        data: event.data,
        orgId: event.orgId,
        timestamp: new Date(),
      },
    });

    // Send to all registered endpoints
    const deliveryPromises = webhooks.map(webhook => 
      this.deliverWebhook(webhook as WebhookEndpoint, {
        ...webhookEvent,
        id: webhookEvent.id,
        timestamp: webhookEvent.timestamp,
      })
    );

    await Promise.allSettled(deliveryPromises);
  }

  /**
   * Deliver webhook to specific endpoint with retry logic
   */
  private async deliverWebhook(webhook: WebhookEndpoint, event: WebhookEvent): Promise<void> {
    // Create delivery record
    const delivery = await db.webhookDelivery.create({
      data: {
        webhookEndpointId: webhook.id,
        eventId: event.id,
        status: 'PENDING',
        attemptCount: 0,
      },
    });

    // Attempt delivery with retry logic
    await this.attemptDelivery(webhook, event, delivery.id);
  }

  /**
   * Attempt webhook delivery with exponential backoff retry
   */
  private async attemptDelivery(webhook: WebhookEndpoint, event: WebhookEvent, deliveryId: string): Promise<void> {
    const delivery = await db.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery || delivery.attemptCount >= webhook.maxRetries) {
      // Mark as failed
      await db.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          status: 'FAILED',
        },
      });

      // Increment failure count on webhook
      await db.webhookEndpoint.update({
        where: { id: webhook.id },
        data: {
          failureCount: { increment: 1 },
        },
      });

      return;
    }

    try {
      // Generate signature
      const signature = this.generateSignature(event, webhook.secret);
      
      // Prepare payload
      const payload = {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
        orgId: event.orgId,
      };

      // Send HTTP request
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event-Type': event.type,
          'X-Webhook-Event-Id': event.id,
          'User-Agent': 'StreamFlow-Webhooks/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Success - mark as delivered
        await db.webhookDelivery.update({
          where: { id: deliveryId },
          data: {
            status: 'DELIVERED',
            httpStatus: response.status,
            responseBody: await response.text(),
            deliveredAt: new Date(),
            attemptCount: { increment: 1 },
          },
        });

        // Update webhook last delivery time
        await db.webhookEndpoint.update({
          where: { id: webhook.id },
          data: {
            lastDeliveryAt: new Date(),
            failureCount: 0, // Reset failure count on success
          },
        });

        // Audit successful delivery
        await auditWebhookAction(
          'webhook.delivered',
          `webhook:${webhook.id}`,
          webhook.orgId,
          {
            eventType: event.type,
            eventId: event.id,
            httpStatus: response.status,
            attemptCount: delivery.attemptCount + 1,
          }
        );

      } else {
        // HTTP error - schedule retry
        await this.scheduleRetry(webhook, event, deliveryId, response.status, await response.text());
      }

    } catch (error) {
      // Network error - schedule retry
      await this.scheduleRetry(webhook, event, deliveryId, 0, (error as Error).message);
    }
  }

  /**
   * Schedule webhook retry with exponential backoff
   */
  private async scheduleRetry(webhook: WebhookEndpoint, event: WebhookEvent, deliveryId: string, httpStatus: number, responseBody: string): Promise<void> {
    const delivery = await db.webhookDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!delivery) return;

    const attemptCount = delivery.attemptCount + 1;
    const nextRetryDelay = Math.min(Math.pow(2, attemptCount) * 1000, 300000); // Max 5 minutes
    const nextRetryAt = new Date(Date.now() + nextRetryDelay);

    await db.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: 'RETRYING',
        httpStatus,
        responseBody,
        attemptCount,
        nextRetryAt,
      },
    });

    // Schedule retry (in production, this would use a queue system)
    setTimeout(() => {
      this.attemptDelivery(webhook, event, deliveryId);
    }, nextRetryDelay);
  }

  /**
   * Generate secure webhook secret
   */
  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(event: WebhookEvent, secret: string): string {
    const payload = JSON.stringify({
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      orgId: event.orgId,
    });

    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Validate webhook URL format
   */
  private isValidWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.hostname !== 'localhost';
    } catch {
      return false;
    }
  }

  /**
   * Get webhook delivery statistics
   */
  async getWebhookStats(orgId: string): Promise<{
    totalEndpoints: number;
    activeEndpoints: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    averageDeliveryTime: number;
  }> {
    const [endpoints, deliveries] = await Promise.all([
      db.webhookEndpoint.findMany({
        where: { orgId },
      }),
      db.webhookDelivery.findMany({
        where: {
          webhookEndpoint: { orgId },
        },
        include: {
          webhookEndpoint: true,
        },
      }),
    ]);

    const successfulDeliveries = deliveries.filter(d => d.status === 'DELIVERED');
    const failedDeliveries = deliveries.filter(d => d.status === 'FAILED');

    const averageDeliveryTime = successfulDeliveries.length > 0
      ? successfulDeliveries.reduce((sum, d) => {
          if (d.deliveredAt) {
            return sum + (d.deliveredAt.getTime() - d.createdAt.getTime());
          }
          return sum;
        }, 0) / successfulDeliveries.length
      : 0;

    return {
      totalEndpoints: endpoints.length,
      activeEndpoints: endpoints.filter(e => e.active).length,
      totalDeliveries: deliveries.length,
      successfulDeliveries: successfulDeliveries.length,
      failedDeliveries: failedDeliveries.length,
      averageDeliveryTime: Math.round(averageDeliveryTime),
    };
  }
}

// Export singleton instance
export const webhookSystem = new WebhookSystem();

// Common webhook event types
export const WebhookEvents = {
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  LEAD_CONVERTED: 'lead.converted',
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  SUBSCRIPTION_CREATED: 'subscription.created',
  SUBSCRIPTION_UPDATED: 'subscription.updated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  USER_CREATED: 'user.created',
  ORGANIZATION_UPDATED: 'organization.updated',
} as const;
