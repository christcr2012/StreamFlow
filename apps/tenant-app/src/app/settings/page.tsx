import { getAuthContext } from '@/lib/auth-context';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader } from '@/components/ui/card';

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
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Organization not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your organization settings</p>
        </div>

        <Card>
          <CardHeader title="Organization Information" />
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Organization Name</p>
                <p className="text-gray-900 mt-1">{org.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Organization ID</p>
                <p className="text-gray-900 font-mono text-sm mt-1">{org.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-gray-900 mt-1">
                  {new Date(org.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="text-gray-900 mt-1">Active</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Usage Statistics" />
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{org._count.users}</p>
                <p className="text-sm text-gray-600 mt-1">Users</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{org._count.customers}</p>
                <p className="text-sm text-gray-600 mt-1">Customers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{org._count.jobs}</p>
                <p className="text-sm text-gray-600 mt-1">Jobs</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{org._count.invoices}</p>
                <p className="text-sm text-gray-600 mt-1">Invoices</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Account Details" />
          <div className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-gray-900 mt-1">{authContext.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Role</p>
              <p className="text-gray-900 mt-1 capitalize">{authContext.role}</p>
            </div>
            {authContext.userId && (
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="text-gray-900 font-mono text-sm mt-1">{authContext.userId}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

