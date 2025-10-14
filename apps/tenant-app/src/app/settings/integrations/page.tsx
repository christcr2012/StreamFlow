import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { IntegrationsClient } from './integrations-client';

async function getIntegrationSettings(orgId: string) {
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      emailProvider: true,
      emailFromAddress: true,
      emailFromName: true,
      emailConfigured: true,
      stripePublishableKey: true,
      stripeConfigured: true,
      smsProvider: true,
      smsFromNumber: true,
      smsConfigured: true,
    },
  });

  if (!org) {
    throw new Error('Organization not found');
  }

  return {
    emailProvider: org.emailProvider,
    emailFromAddress: org.emailFromAddress,
    emailFromName: org.emailFromName,
    emailConfigured: org.emailConfigured,
    stripePublishableKey: org.stripePublishableKey,
    stripeConfigured: org.stripeConfigured,
    smsProvider: org.smsProvider,
    smsFromNumber: org.smsFromNumber,
    smsConfigured: org.smsConfigured,
  };
}

export default async function IntegrationsPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated) {
    redirect('/login');
  }

  if (!authContext.orgId) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">No organization found for this user.</p>
          </div>
        </div>
      </div>
    );
  }

  const settings = await getIntegrationSettings(authContext.orgId);

  return <IntegrationsClient settings={settings} />;
}

