import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import { AISettingsClient } from './ai-settings-client';

export const metadata: Metadata = {
  title: 'AI Features Settings | Cortiware',
  description: 'Manage AI-powered features and data sharing preferences',
};

export default async function AISettingsPage() {
  const authContext = await getAuthContext();
  
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          AI Features Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage how Cortiware uses artificial intelligence to enhance your experience
        </p>
      </div>

      <AISettingsClient orgId={authContext.orgId} />
    </div>
  );
}

