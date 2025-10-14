import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Reports & Analytics | Cortiware',
  description: 'View business reports and analytics',
};

export default async function ReportsPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  const reports = [
    {
      title: 'Revenue Trends',
      description: 'Track revenue over time with daily, weekly, and monthly views',
      href: '/reports/revenue',
      icon: '📈',
    },
    {
      title: 'Customer Insights',
      description: 'Top customers by revenue and payment history analysis',
      href: '/reports/customers',
      icon: '👥',
    },
    {
      title: 'Job Completion Metrics',
      description: 'Completion rates, average time, and status breakdown',
      href: '/reports/jobs',
      icon: '📊',
    },
    {
      title: 'Invoice Aging',
      description: 'Track overdue invoices by aging buckets',
      href: '/reports/invoices',
      icon: '📄',
    },
  ];

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">View insights and analytics for your business</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <Link
              key={report.href}
              href={report.href}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{report.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">{report.title}</h2>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

