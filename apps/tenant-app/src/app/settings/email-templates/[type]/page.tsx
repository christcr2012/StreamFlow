import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import EmailTemplateEditor from './email-template-editor';

export const metadata: Metadata = {
  title: 'Edit Email Template | Cortiware',
  description: 'Edit email template',
};

const TEMPLATE_TYPES = ['invoice_sent', 'payment_received', 'job_status_update', 'job_completed'];

const TEMPLATE_NAMES: Record<string, string> = {
  invoice_sent: 'Invoice Sent',
  payment_received: 'Payment Received',
  job_status_update: 'Job Status Update',
  job_completed: 'Job Completed',
};

const DEFAULT_TEMPLATES: Record<string, { subject: string; htmlBody: string; textBody: string }> = {
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

export default async function EmailTemplateEditorPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const authContext = await getAuthContext();
  
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  if (!TEMPLATE_TYPES.includes(type)) {
    notFound();
  }

  const template = await prisma.emailTemplate.findUnique({
    where: {
      orgId_templateType: {
        orgId: authContext.orgId,
        templateType: type,
      },
    },
  });

  const defaultTemplate = DEFAULT_TEMPLATES[type];

  return (
    <EmailTemplateEditor
      templateType={type}
      templateName={TEMPLATE_NAMES[type]}
      template={template ? {
        ...template,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      } : null}
      defaultTemplate={defaultTemplate}
    />
  );
}

