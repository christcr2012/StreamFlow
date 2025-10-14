/**
 * Email Notification Triggers
 *
 * Centralized email notification system for various events
 *
 * NOTE: This module provides helper functions for sending email notifications.
 * The actual email sending logic is in email-service.ts.
 * These functions are meant to be called from API routes or server actions
 * where you already have the full entity data loaded.
 */

import { sendEmail } from './email-service';
import {
  getInvoiceSentEmailTemplate,
  getPaymentReceivedEmailTemplate,
  getJobStatusUpdateEmailTemplate,
} from './email-service';

/**
 * Send invoice notification
 *
 * This is a simplified helper that should be called from API routes
 * where you already have the invoice data loaded.
 */
export interface InvoiceEmailData {
  customerEmail: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  invoiceId: string;
}

export async function sendInvoiceEmail(
  orgId: string,
  data: InvoiceEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailTemplate = getInvoiceSentEmailTemplate({
      customerName: data.customerName,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      dueDate: data.dueDate,
      invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${data.invoiceId}`,
    });

    const result = await sendEmail(orgId, {
      to: data.customerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return result;
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send job status update email
 */
export interface JobStatusEmailData {
  customerEmail: string;
  customerName: string;
  jobTitle: string;
  oldStatus: string;
  newStatus: string;
  scheduledDate?: Date | any;
}

export async function sendJobStatusEmail(
  orgId: string,
  data: JobStatusEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    const emailTemplate = getJobStatusUpdateEmailTemplate({
      customerName: data.customerName,
      jobTitle: data.jobTitle,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      scheduledDate: data.scheduledDate,
    });

    const result = await sendEmail(orgId, {
      to: data.customerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text,
    });

    return result;
  } catch (error) {
    console.error('Error sending job status email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example usage in an API route:
 *
 * // In your invoice creation API route:
 * const invoice = await prisma.invoice.create({ ... });
 *
 * if (invoice.customer?.primaryEmail) {
 *   await sendInvoiceEmail(orgId, {
 *     customerEmail: invoice.customer.primaryEmail,
 *     customerName: invoice.customer.company || invoice.customer.primaryName || 'Customer',
 *     invoiceNumber: invoice.number || 'DRAFT',
 *     amount: Number(invoice.amount),
 *     dueDate: invoice.dueDate || new Date(),
 *     invoiceId: invoice.id,
 *   });
 * }
 *
 * // In your job status update API route:
 * const job = await prisma.job.update({ ... });
 *
 * if (job.customer?.primaryEmail) {
 *   await sendJobStatusEmail(orgId, {
 *     customerEmail: job.customer.primaryEmail,
 *     customerName: job.customer.company || job.customer.primaryName || 'Customer',
 *     jobTitle: job.title,
 *     oldStatus: previousStatus,
 *     newStatus: job.status,
 *     scheduledDate: job.scheduledAt,
 *   });
 * }
 */

