import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Invoice Settings | Cortiware',
  description: 'Configure invoice reminder settings',
};

export default async function InvoiceSettingsPage() {
  const authContext = await getAuthContext();
  if (!authContext.isAuthenticated || !authContext.orgId) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoice Settings</h1>
          <p className="text-gray-600 mt-2">Configure automatic invoice reminders and notifications</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Automatic Reminders</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure automatic email reminders for overdue invoices. Reminders are sent based on the number of days past the due date.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <h3 className="font-medium">3-Day Overdue Reminder</h3>
                <p className="text-sm text-gray-600">Send reminder 3 days after invoice due date</p>
              </div>
              <div className="text-sm text-gray-500">
                Manual only (see documentation for cron setup)
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <h3 className="font-medium">7-Day Overdue Reminder</h3>
                <p className="text-sm text-gray-600">Send reminder 7 days after invoice due date</p>
              </div>
              <div className="text-sm text-gray-500">
                Manual only (see documentation for cron setup)
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <h3 className="font-medium">14-Day Overdue Reminder</h3>
                <p className="text-sm text-gray-600">Send reminder 14 days after invoice due date</p>
              </div>
              <div className="text-sm text-gray-500">
                Manual only (see documentation for cron setup)
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-medium text-blue-900 mb-2">📘 Cron Setup Documentation</h3>
            <p className="text-sm text-blue-800 mb-2">
              To enable automatic reminders, you need to set up a cron job that calls the reminder API endpoint.
            </p>
            <p className="text-sm text-blue-800">
              See <code className="bg-blue-100 px-1 rounded">docs/INVOICE_REMINDERS_CRON.md</code> for detailed setup instructions.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold">Manual Reminders</h2>
          <p className="text-sm text-gray-600">
            You can manually send reminders from the invoice detail page by clicking the &quot;Send Reminder&quot; button.
            The system will automatically determine the appropriate reminder type based on how many days the invoice is overdue.
          </p>
        </div>
      </div>
    </div>
  );
}

