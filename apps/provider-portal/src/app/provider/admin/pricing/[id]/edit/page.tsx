/**
 * Edit Pricing Plan Page
 * 
 * Allows super admins to edit an existing pricing plan
 */

import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import PricingPlanForm from '../../components/PricingPlanForm';

async function checkSuperAdminAccess() {
  const cookieStore = await cookies();
  const hasProviderSession = cookieStore.get('rs_provider') || cookieStore.get('provider-session') || cookieStore.get('ws_provider');
  
  if (!hasProviderSession) {
    redirect('/login');
  }
  
  // TODO: Add actual super admin role check when user/role system is implemented
  // For now, allow access if authenticated as provider
  return true;
}

export default async function EditPricingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkSuperAdminAccess();
  
  const { id } = await params;

  // Fetch the plan with features
  const plan = await prisma.marketingPricingPlan.findUnique({
    where: { id },
    include: {
      features: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!plan) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit Pricing Plan
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Update pricing plan: {plan.name}
        </p>
      </div>

      <PricingPlanForm mode="edit" initialData={plan} />
    </div>
  );
}

