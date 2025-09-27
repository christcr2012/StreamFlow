// src/pages/billing/invoices/index.tsx
/**
 * CURRENT: Basic invoice listing interface
 * 
 * 🚀 ENTERPRISE INVOICE MANAGEMENT UI ROADMAP:
 * ============================================
 * 
 * 📋 ADVANCED INVOICE INTERFACE:
 * - Smart filtering and search capabilities
 * - Bulk operations (approve, send, void)
 * - Invoice status workflow visualization
 * - Real-time payment status updates
 * - Advanced sorting and grouping options
 * - Export to multiple formats (PDF, Excel, CSV)
 * - Invoice preview and inline editing
 * 
 * 💳 PAYMENT OPTIMIZATION FEATURES:
 * - Payment success rate analytics
 * - Failed payment recovery workflows
 * - Payment method optimization suggestions
 * - Dunning management interface
 * - Payment retry automation controls
 * - Customer payment behavior insights
 * 
 * 🌍 GLOBAL BILLING CAPABILITIES:
 * - Multi-currency display and management
 * - Tax compliance indicators per jurisdiction
 * - Local payment method status tracking
 * - Currency conversion history
 * - Regional billing performance metrics
 * 
 * 📊 ENTERPRISE ANALYTICS:
 * - Revenue recognition tracking
 * - Aging reports and collections analytics
 * - Invoice efficiency metrics
 * - Customer payment behavior patterns
 * - Billing cycle optimization insights
 */
import Head from "next/head";
import useSWR from "swr";
import Link from "next/link";

type Item = {
  id: string;
  number: string;
  periodFrom: string;
  periodTo: string;
  status: string;
  totalCents: number;
  subtotalCents: number;
  taxCents: number;
  createdAt: string;
  stripeInvoiceId: string | null;
};

export default function InvoicesPage() {
  const { data, error } = useSWR("/api/billing/list", (u) => fetch(u).then((r) => r.json()));
  const items: Item[] = (data?.items || []) as Item[];

  return (
    <>
      <Head><title>Invoices</title></Head>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        {error && <div className="text-red-600">Failed to load invoices.</div>}
        <div className="overflow-x-auto border rounded">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-2">#</th>
                <th className="p-2">Period</th>
                <th className="p-2">Status</th>
                <th className="p-2">Total</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No invoices yet.</td></tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="p-2">{it.number}</td>
                    <td className="p-2">{it.periodFrom.slice(0,10)} → {it.periodTo.slice(0,10)}</td>
                    <td className="p-2">{it.status}</td>
                    <td className="p-2">${(it.totalCents/100).toFixed(2)}</td>
                    <td className="p-2">
                      <Link className="text-blue-600" href={`/billing/invoices/${it.id}`}>Details</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
