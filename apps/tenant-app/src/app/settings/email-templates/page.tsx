import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { prisma } from '@/lib/prisma';
import EmailTemplatesClient from './email-templates-client';

export const metadata: Metadata = {
  title: 'Email Templates | Cortiware',
  description: 'Customize email templates',
};

export default async function EmailTemplatesPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  const templates = await prisma.emailTemplate.findMany({
    where: { orgId: authContext.orgId },
    orderBy: { templateType: 'asc' },
  });

  const templateTypes = [
    { type: 'invoice_sent', name: 'Invoice Sent', description: 'Sent when an invoice is created and sent to a customer' },
    { type: 'payment_received', name: 'Payment Received', description: 'Sent when a payment is received for an invoice' },
    { type: 'job_status_update', name: 'Job Status Update', description: 'Sent when a job status changes' },
    { type: 'job_completed', name: 'Job Completed', description: 'Sent when a job is marked as completed' },
  ];

  return (
    <EmailTemplatesClient
      templates={templates.map((t: any) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))}
      templateTypes={templateTypes}
    />
  );
}

