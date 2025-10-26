import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import dynamic from 'next/dynamic';

const AICostDashboard = dynamic(() => import('@/components/ai/AICostDashboard'), { ssr: false });

export const metadata: Metadata = {
  title: 'AI Cost Management | Cortiware',
  description: 'Track AI usage and manage budgets',
};

export default async function AICostPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          AI Cost Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor your AI usage and spending. Configure budgets and alerts to stay in control.
        </p>
      </div>

      <AICostDashboard />
    </div>
  );
}
