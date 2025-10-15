import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import ThemeSettingsClient from './theme-settings-client';

export const metadata: Metadata = {
  title: 'Theme Settings | Cortiware',
  description: 'Customize your organization theme',
};

export default async function ThemeSettingsPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  // Only tenant owners can access theme settings
  if (authContext.role !== 'tenant') {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              Only organization owners can customize theme settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <ThemeSettingsClient />;
}

