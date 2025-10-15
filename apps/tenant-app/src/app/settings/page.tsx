import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/card';
import { ThemeSwitcher } from '@/components/theme-switcher';
import Link from 'next/link';

async function getOrgData(orgId: string) {
  const org = await prisma.org.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: {
          users: true,
          customers: true,
          jobs: true,
          invoices: true,
        },
      },
    },
  });

  return org;
}

export default async function SettingsPage() {
  const authContext = await getAuthContext();

  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/login');
  }

  const org = await getOrgData(authContext.orgId);

  if (!org) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">Organization not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">Manage your organization settings</p>
        </div>

        <Card>
          <CardHeader title="Organization Information" />
          <div className="p-4 md:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization Name</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{org.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Organization ID</p>
                <p className="text-gray-900 dark:text-gray-100 font-mono text-sm mt-1">{org.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {new Date(org.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">Active</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Usage Statistics" />
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{org._count.users}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Users</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{org._count.customers}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Customers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{org._count.jobs}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{org._count.invoices}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Invoices</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Account Details" />
          <div className="p-4 md:p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1">{authContext.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Role</p>
              <p className="text-gray-900 dark:text-gray-100 mt-1 capitalize">{authContext.role}</p>
            </div>
            {authContext.userId && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">User ID</p>
                <p className="text-gray-900 dark:text-gray-100 font-mono text-sm mt-1">{authContext.userId}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Appearance" />
          <div className="p-4 md:p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose your preferred theme. System preference will automatically switch between light and dark mode based on your device settings.
            </p>
            <div className="flex items-center gap-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme:</p>
              <ThemeSwitcher />
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Integrations" />
          <div className="p-4 md:p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Configure third-party services to enable email notifications, payment processing, and more.
            </p>
            <Link
              href="/settings/integrations"
              className="inline-flex items-center px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              style={{ minHeight: '44px' }}
            >
              Manage Integrations →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

