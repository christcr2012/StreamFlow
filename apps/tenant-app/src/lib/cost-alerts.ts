/**
 * Cost Alert System for AI/SMS Usage
 * 
 * Monitors AI and SMS usage costs and sends alerts when thresholds are exceeded.
 * Integrates with the wallet system to track spending.
 */

import { prisma } from './prisma';

// TODO: Implement email sending when @cortiware/notifications package is created
async function sendEmail(options: { to: string; subject: string; html: string }) {
  console.log('Email would be sent:', options);
  // Placeholder for now - will be implemented with actual email service
}

export interface CostAlert {
  id: string;
  orgId: string;
  alertType: 'AI_USAGE' | 'SMS_USAGE' | 'TOTAL_USAGE';
  threshold: number; // in cents
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  email: string;
  webhookUrl?: string;
  enabled: boolean;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageSummary {
  aiUsage: number; // in cents
  smsUsage: number; // in cents
  totalUsage: number; // in cents
  period: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Get usage summary for an organization
 */
export async function getUsageSummary(
  orgId: string,
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY'
): Promise<UsageSummary> {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'DAILY':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'WEEKLY':
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'MONTHLY':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  // Get AI usage
  const aiUsage = await prisma.aIUsageLog.aggregate({
    where: {
      orgId,
      createdAt: { gte: startDate },
    },
    _sum: {
      costCents: true,
    },
  });

  // Get SMS usage
  const smsUsage = await prisma.sMSLog.aggregate({
    where: {
      orgId,
      createdAt: { gte: startDate },
    },
    _sum: {
      costCents: true,
    },
  });

  const aiCost = aiUsage._sum.costCents || 0;
  const smsCost = smsUsage._sum.costCents || 0;

  return {
    aiUsage: aiCost,
    smsUsage: smsCost,
    totalUsage: aiCost + smsCost,
    period,
    startDate,
    endDate: now,
  };
}

/**
 * Check cost alerts for an organization
 */
export async function checkCostAlerts(orgId: string): Promise<void> {
  // Get all enabled alerts for this org
  const alerts = await prisma.costAlert.findMany({
    where: {
      orgId,
      enabled: true,
    },
  });

  for (const alert of alerts) {
    // Get usage summary for the alert period
    const summary = await getUsageSummary(orgId, alert.period);

    // Determine which usage to check based on alert type
    let currentUsage: number;
    switch (alert.alertType) {
      case 'AI_USAGE':
        currentUsage = summary.aiUsage;
        break;
      case 'SMS_USAGE':
        currentUsage = summary.smsUsage;
        break;
      case 'TOTAL_USAGE':
        currentUsage = summary.totalUsage;
        break;
    }

    // Check if threshold is exceeded
    if (currentUsage >= alert.threshold) {
      // Check if we've already triggered this alert recently (within the period)
      const shouldTrigger = !alert.lastTriggered || 
        isNewPeriod(alert.lastTriggered, alert.period);

      if (shouldTrigger) {
        await triggerAlert(alert, summary, currentUsage);
      }
    }
  }
}

/**
 * Check if we're in a new period since last trigger
 */
function isNewPeriod(lastTriggered: Date, period: 'DAILY' | 'WEEKLY' | 'MONTHLY'): boolean {
  const now = new Date();
  
  switch (period) {
    case 'DAILY':
      return now.getDate() !== lastTriggered.getDate() ||
             now.getMonth() !== lastTriggered.getMonth() ||
             now.getFullYear() !== lastTriggered.getFullYear();
    case 'WEEKLY':
      const weeksDiff = Math.floor((now.getTime() - lastTriggered.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksDiff >= 1;
    case 'MONTHLY':
      return now.getMonth() !== lastTriggered.getMonth() ||
             now.getFullYear() !== lastTriggered.getFullYear();
  }
}

/**
 * Trigger a cost alert
 */
async function triggerAlert(
  alert: any,
  summary: UsageSummary,
  currentUsage: number
): Promise<void> {
  console.log(`🚨 Cost alert triggered for org ${alert.orgId}:`, {
    alertType: alert.alertType,
    threshold: alert.threshold,
    currentUsage,
    period: alert.period,
  });

  // Send email notification
  if (alert.email) {
    await sendEmail({
      to: alert.email,
      subject: `Cost Alert: ${alert.alertType} threshold exceeded`,
      html: `
        <h2>Cost Alert Triggered</h2>
        <p>Your ${alert.alertType.replace('_', ' ').toLowerCase()} has exceeded the threshold.</p>
        <ul>
          <li><strong>Threshold:</strong> $${(alert.threshold / 100).toFixed(2)}</li>
          <li><strong>Current Usage:</strong> $${(currentUsage / 100).toFixed(2)}</li>
          <li><strong>Period:</strong> ${alert.period}</li>
          <li><strong>AI Usage:</strong> $${(summary.aiUsage / 100).toFixed(2)}</li>
          <li><strong>SMS Usage:</strong> $${(summary.smsUsage / 100).toFixed(2)}</li>
          <li><strong>Total Usage:</strong> $${(summary.totalUsage / 100).toFixed(2)}</li>
        </ul>
        <p>Please review your usage and consider topping up your wallet if needed.</p>
      `,
    });
  }

  // Send webhook notification
  if (alert.webhookUrl) {
    try {
      await fetch(alert.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertType: alert.alertType,
          threshold: alert.threshold,
          currentUsage,
          period: alert.period,
          summary,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
    }
  }

  // Update last triggered timestamp
  await prisma.costAlert.update({
    where: { id: alert.id },
    data: { lastTriggered: new Date() },
  });
}

/**
 * Create a cost alert
 */
export async function createCostAlert(
  orgId: string,
  alertType: 'AI_USAGE' | 'SMS_USAGE' | 'TOTAL_USAGE',
  threshold: number,
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY',
  email: string,
  webhookUrl?: string
): Promise<CostAlert> {
  return await prisma.costAlert.create({
    data: {
      orgId,
      alertType,
      threshold,
      period,
      email,
      webhookUrl,
      enabled: true,
    },
  }) as any;
}

/**
 * Update a cost alert
 */
export async function updateCostAlert(
  alertId: string,
  updates: Partial<Pick<CostAlert, 'threshold' | 'email' | 'webhookUrl' | 'enabled'>>
): Promise<CostAlert> {
  return await prisma.costAlert.update({
    where: { id: alertId },
    data: updates,
  }) as any;
}

/**
 * Delete a cost alert
 */
export async function deleteCostAlert(alertId: string): Promise<void> {
  await prisma.costAlert.delete({
    where: { id: alertId },
  });
}

/**
 * List cost alerts for an organization
 */
export async function listCostAlerts(orgId: string): Promise<CostAlert[]> {
  return await prisma.costAlert.findMany({
    where: { orgId },
    orderBy: { createdAt: 'desc' },
  }) as any[];
}

