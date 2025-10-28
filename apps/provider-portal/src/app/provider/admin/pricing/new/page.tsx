/**
 * Create New Pricing Plan Page
 * 
 * Allows super admins to create a new pricing plan for the Cortiware marketing site
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import PricingPlanForm from '../components/PricingPlanForm';

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

export default async function NewPricingPlanPage() {
  await checkSuperAdminAccess();

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create New Pricing Plan
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create a new pricing plan for the Cortiware marketing website
        </p>
      </div>

      <PricingPlanForm mode="create" />
    </div>
  );
}

