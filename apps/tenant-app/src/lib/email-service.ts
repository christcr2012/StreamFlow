/**
 * Email Service - Tenant-Specific Email Sending
 * 
 * This service sends emails using each tenant's own email service credentials
 * (SendGrid or Resend) configured in their organization settings.
 * 
 * Each tenant must configure their own email service in Settings → Integrations.
 */

import { prisma } from './prisma';
import { decrypt } from './encryption';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: {
    email: string;
    name: string;
  };
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using the tenant's configured email service
 * 
 * @param orgId - The organization ID (tenant)
 * @param options - Email options (to, subject, text/html)
 * @returns Result indicating success or failure
 */
export async function sendEmail(orgId: string, options: EmailOptions): Promise<EmailResult> {
  try {
    // Get the tenant's email configuration
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        emailProvider: true,
        emailApiKey: true,
        emailFromAddress: true,
        emailFromName: true,
        emailConfigured: true,
      },
    });

    if (!org || !org.emailConfigured || !org.emailApiKey) {
      return {
        success: false,
        error: 'Email service not configured for this organization. Please configure in Settings → Integrations.',
      };
    }

    // Decrypt the API key
    const apiKey = decrypt(org.emailApiKey);

    // Determine sender
    const from = options.from || {
      email: org.emailFromAddress!,
      name: org.emailFromName!,
    };

    // Send email based on provider
    if (org.emailProvider === 'sendgrid') {
      return await sendViaSendGrid(apiKey, from, options);
    } else if (org.emailProvider === 'resend') {
      return await sendViaResend(apiKey, from, options);
    } else {
      return {
        success: false,
        error: `Unsupported email provider: ${org.emailProvider}`,
      };
    }
  } catch (error) {
    console.error('Email service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(
  apiKey: string,
  from: { email: string; name: string },
  options: EmailOptions
): Promise<EmailResult> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: Array.isArray(options.to)
              ? options.to.map((email) => ({ email }))
              : [{ email: options.to }],
          },
        ],
        from: {
          email: from.email,
          name: from.name,
        },
        subject: options.subject,
        content: [
          {
            type: options.html ? 'text/html' : 'text/plain',
            value: options.html || options.text || '',
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'SendGrid API error');
    }

    // SendGrid returns 202 Accepted with X-Message-Id header
    const messageId = response.headers.get('X-Message-Id') || undefined;

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SendGrid error',
    };
  }
}

/**
 * Send email via Resend
 */
async function sendViaResend(
  apiKey: string,
  from: { email: string; name: string },
  options: EmailOptions
): Promise<EmailResult> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${from.name} <${from.email}>`,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Resend API error');
    }

    const result = await response.json();

    return {
      success: true,
      messageId: result.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Resend error',
    };
  }
}

/**
 * Email Templates
 */

export function getInvoiceSentEmailTemplate(data: {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: Date;
  invoiceUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `Invoice ${data.invoiceNumber} from ${data.customerName}`;
  
  const text = `
Hello,

You have received a new invoice.

Invoice Number: ${data.invoiceNumber}
Amount: $${(data.amount / 100).toFixed(2)}
Due Date: ${data.dueDate.toLocaleDateString()}

View and pay your invoice: ${data.invoiceUrl}

Thank you for your business!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .invoice-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Invoice</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have received a new invoice.</p>
      
      <div class="invoice-details">
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Amount:</strong> $${(data.amount / 100).toFixed(2)}</p>
        <p><strong>Due Date:</strong> ${data.dueDate.toLocaleDateString()}</p>
      </div>
      
      <a href="${data.invoiceUrl}" class="button">View & Pay Invoice</a>
      
      <p>Thank you for your business!</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export function getPaymentReceivedEmailTemplate(data: {
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: Date;
}): { subject: string; html: string; text: string } {
  const subject = `Payment Received - Invoice ${data.invoiceNumber}`;
  
  const text = `
Hello,

We have received your payment. Thank you!

Invoice Number: ${data.invoiceNumber}
Amount Paid: $${(data.amount / 100).toFixed(2)}
Payment Date: ${data.paymentDate.toLocaleDateString()}

Your invoice has been marked as paid.

Thank you for your business!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .payment-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Received</h1>
    </div>
    <div class="content">
      <div class="success-icon">✓</div>
      <p>Hello,</p>
      <p>We have received your payment. Thank you!</p>
      
      <div class="payment-details">
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Amount Paid:</strong> $${(data.amount / 100).toFixed(2)}</p>
        <p><strong>Payment Date:</strong> ${data.paymentDate.toLocaleDateString()}</p>
      </div>
      
      <p>Your invoice has been marked as paid.</p>
      <p>Thank you for your business!</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

export function getJobStatusUpdateEmailTemplate(data: {
  customerName: string;
  jobTitle: string;
  oldStatus: string;
  newStatus: string;
  scheduledDate?: Date;
}): { subject: string; html: string; text: string } {
  const subject = `Job Status Update: ${data.jobTitle}`;
  
  const text = `
Hello ${data.customerName},

Your job status has been updated.

Job: ${data.jobTitle}
Status: ${data.oldStatus} → ${data.newStatus}
${data.scheduledDate ? `Scheduled: ${data.scheduledDate.toLocaleDateString()}` : ''}

We'll keep you updated on the progress.

Thank you!
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3B82F6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background-color: #f9fafb; }
    .job-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 8px; }
    .status-change { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 15px 0; }
    .status { padding: 8px 16px; border-radius: 6px; background-color: #e5e7eb; }
    .arrow { font-size: 24px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Job Status Update</h1>
    </div>
    <div class="content">
      <p>Hello ${data.customerName},</p>
      <p>Your job status has been updated.</p>
      
      <div class="job-details">
        <p><strong>Job:</strong> ${data.jobTitle}</p>
        <div class="status-change">
          <span class="status">${data.oldStatus}</span>
          <span class="arrow">→</span>
          <span class="status">${data.newStatus}</span>
        </div>
        ${data.scheduledDate ? `<p><strong>Scheduled:</strong> ${data.scheduledDate.toLocaleDateString()}</p>` : ''}
      </div>
      
      <p>We'll keep you updated on the progress.</p>
      <p>Thank you!</p>
    </div>
    <div class="footer">
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, html, text };
}

/**
 * Apply template variables to a template string
 */
function applyTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Get custom email template or use default
 */
export async function getEmailTemplate(
  orgId: string,
  templateType: 'invoice_sent' | 'payment_received' | 'job_status_update' | 'job_completed',
  variables: Record<string, string>
): Promise<{ subject: string; html: string; text: string }> {
  try {
    // Try to get custom template
    const customTemplate = await prisma.emailTemplate.findUnique({
      where: {
        orgId_templateType: {
          orgId,
          templateType,
        },
        active: true,
      },
    });

    if (customTemplate) {
      return {
        subject: applyTemplateVariables(customTemplate.subject, variables),
        html: applyTemplateVariables(customTemplate.htmlBody, variables),
        text: applyTemplateVariables(customTemplate.textBody, variables),
      };
    }

    // Fall back to default templates
    switch (templateType) {
      case 'invoice_sent':
        return createInvoiceSentEmail(variables);
      case 'payment_received':
        return createPaymentReceivedEmail(variables);
      case 'job_status_update':
        return createJobStatusUpdateEmail(variables);
      case 'job_completed':
        return createJobCompletedEmail(variables);
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  } catch (error) {
    console.error('Error getting email template:', error);
    // Fall back to default templates on error
    switch (templateType) {
      case 'invoice_sent':
        return createInvoiceSentEmail(variables);
      case 'payment_received':
        return createPaymentReceivedEmail(variables);
      case 'job_status_update':
        return createJobStatusUpdateEmail(variables);
      case 'job_completed':
        return createJobCompletedEmail(variables);
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }
}

// Helper functions for default templates
function createInvoiceSentEmail(variables: Record<string, string>) {
  const subject = `Invoice ${variables.invoiceNumber || 'N/A'} from Your Company`;
  const html = `<p>Dear ${variables.customerName || 'Customer'},</p><p>Your invoice <strong>${variables.invoiceNumber || 'N/A'}</strong> for <strong>${variables.amount || 'N/A'}</strong> is ready.</p><p>Due Date: ${variables.dueDate || 'N/A'}</p><p>Thank you for your business!</p>`;
  const text = `Dear ${variables.customerName || 'Customer'},\n\nYour invoice ${variables.invoiceNumber || 'N/A'} for ${variables.amount || 'N/A'} is ready.\n\nDue Date: ${variables.dueDate || 'N/A'}\n\nThank you for your business!`;
  return { subject, html, text };
}

function createPaymentReceivedEmail(variables: Record<string, string>) {
  const subject = `Payment Received for Invoice ${variables.invoiceNumber || 'N/A'}`;
  const html = `<p>Dear ${variables.customerName || 'Customer'},</p><p>We have received your payment of <strong>${variables.amount || 'N/A'}</strong> for invoice <strong>${variables.invoiceNumber || 'N/A'}</strong>.</p><p>Thank you for your payment!</p>`;
  const text = `Dear ${variables.customerName || 'Customer'},\n\nWe have received your payment of ${variables.amount || 'N/A'} for invoice ${variables.invoiceNumber || 'N/A'}.\n\nThank you for your payment!`;
  return { subject, html, text };
}

function createJobStatusUpdateEmail(variables: Record<string, string>) {
  const subject = `Job Status Update: ${variables.jobTitle || 'N/A'}`;
  const html = `<p>Dear ${variables.customerName || 'Customer'},</p><p>The status of your job <strong>${variables.jobTitle || 'N/A'}</strong> has been updated to <strong>${variables.status || 'N/A'}</strong>.</p><p>We will keep you informed of any further updates.</p>`;
  const text = `Dear ${variables.customerName || 'Customer'},\n\nThe status of your job ${variables.jobTitle || 'N/A'} has been updated to ${variables.status || 'N/A'}.\n\nWe will keep you informed of any further updates.`;
  return { subject, html, text };
}

function createJobCompletedEmail(variables: Record<string, string>) {
  const subject = `Job Completed: ${variables.jobTitle || 'N/A'}`;
  const html = `<p>Dear ${variables.customerName || 'Customer'},</p><p>Your job <strong>${variables.jobTitle || 'N/A'}</strong> has been completed!</p><p>Thank you for choosing our services.</p>`;
  const text = `Dear ${variables.customerName || 'Customer'},\n\nYour job ${variables.jobTitle || 'N/A'} has been completed!\n\nThank you for choosing our services.`;
  return { subject, html, text };
}
