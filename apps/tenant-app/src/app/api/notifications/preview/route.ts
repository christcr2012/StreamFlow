import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/notifications/preview
 *
 * Email preview functionality - generates preview of email template with sample data
 *
 * Query params:
 * - type: Email template type (invoice_sent, payment_received, job_status_update, job_completed)
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    if (!authContext.isAuthenticated || !authContext.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json({ error: 'Template type is required' }, { status: 400 });
    }

    // Load template from database
    const template = await prisma.emailTemplate.findFirst({
      where: {
        orgId: authContext.orgId,
        type,
      },
    });

    // Sample data for preview
    const sampleData: Record<string, string> = {
      customerName: 'John Doe',
      invoiceNumber: 'INV-001',
      amount: '$1,234.56',
      dueDate: new Date().toLocaleDateString(),
      jobTitle: 'Office Cleaning - Main Building',
      status: 'In Progress',
    };

    // Merge template with sample data
    const mergeTemplate = (text: string) => {
      return Object.entries(sampleData).reduce((result, [key, value]) => {
        return result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
      }, text);
    };

    if (template) {
      return NextResponse.json({
        subject: mergeTemplate(template.subject),
        htmlBody: mergeTemplate(template.htmlBody),
        textBody: mergeTemplate(template.textBody || ''),
        sampleData,
      });
    }

    // Return default template if no custom template exists
    const defaultTemplates: Record<string, { subject: string; htmlBody: string; textBody: string }> = {
      invoice_sent: {
        subject: 'Invoice {{invoiceNumber}} from Your Company',
        htmlBody: '<p>Dear {{customerName}},</p><p>Your invoice <strong>{{invoiceNumber}}</strong> for <strong>{{amount}}</strong> is ready.</p><p>Due Date: {{dueDate}}</p><p>Thank you for your business!</p>',
        textBody: 'Dear {{customerName}},\n\nYour invoice {{invoiceNumber}} for {{amount}} is ready.\n\nDue Date: {{dueDate}}\n\nThank you for your business!',
      },
      payment_received: {
        subject: 'Payment Received for Invoice {{invoiceNumber}}',
        htmlBody: '<p>Dear {{customerName}},</p><p>We have received your payment of <strong>{{amount}}</strong> for invoice <strong>{{invoiceNumber}}</strong>.</p><p>Thank you for your payment!</p>',
        textBody: 'Dear {{customerName}},\n\nWe have received your payment of {{amount}} for invoice {{invoiceNumber}}.\n\nThank you for your payment!',
      },
      job_status_update: {
        subject: 'Job Status Update: {{jobTitle}}',
        htmlBody: '<p>Dear {{customerName}},</p><p>The status of your job <strong>{{jobTitle}}</strong> has been updated to <strong>{{status}}</strong>.</p><p>We will keep you informed of any further updates.</p>',
        textBody: 'Dear {{customerName}},\n\nThe status of your job {{jobTitle}} has been updated to {{status}}.\n\nWe will keep you informed of any further updates.',
      },
      job_completed: {
        subject: 'Job Completed: {{jobTitle}}',
        htmlBody: '<p>Dear {{customerName}},</p><p>Your job <strong>{{jobTitle}}</strong> has been completed!</p><p>Thank you for choosing our services.</p>',
        textBody: 'Dear {{customerName}},\n\nYour job {{jobTitle}} has been completed!\n\nThank you for choosing our services.',
      },
    };

    const defaultTemplate = defaultTemplates[type];
    if (!defaultTemplate) {
      return NextResponse.json({ error: 'Invalid template type' }, { status: 400 });
    }

    return NextResponse.json({
      subject: mergeTemplate(defaultTemplate.subject),
      htmlBody: mergeTemplate(defaultTemplate.htmlBody),
      textBody: mergeTemplate(defaultTemplate.textBody),
      sampleData,
    });
  } catch (error) {
    console.error('Error previewing email:', error);
    return NextResponse.json(
      { error: 'Failed to preview email' },
      { status: 500 }
    );
  }
}

