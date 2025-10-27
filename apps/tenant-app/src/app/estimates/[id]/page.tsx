// apps/tenant-app/src/app/estimates/[id]/page.tsx
// Estimate detail placeholder - Phase 1 stub

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Estimate Details | Cortiware",
};

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Estimate {
  id: string;
  publicId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  jobTitle: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  validUntil: string;
  createdAt: string;
  approvedAt?: string;
  declinedAt?: string;
  lineItems: LineItem[];
}

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await getAuthContext();
  if (!auth.isAuthenticated || !auth.orgId) {
    redirect("/login");
  }

  // Fetch all estimates and pick the one by id (Phase 1 stub API doesn't support single fetch yet)
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/estimates`,
    {
      cache: "no-store",
    },
  );
  const data = (await res.json()) as { estimates: Estimate[] };
  const estimate = data.estimates.find((e) => e.id === id);

  if (!estimate) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900">Estimate not found</h1>
        <p className="mt-2 text-gray-600">
          This is a Phase 1 stub detail page. Create the estimate detail API in
          Phase 2.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Estimate {estimate.publicId}
        </h1>
        <p className="text-gray-600">{estimate.jobTitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Customer</h2>
          <p className="text-gray-800">{estimate.customerName}</p>
          <p className="text-gray-500 text-sm">{estimate.customerEmail}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Summary</h2>
          <p className="text-gray-700">
            Status:{" "}
            <span className="font-medium capitalize">{estimate.status}</span>
          </p>
          <p className="text-gray-700">
            Valid Until: {new Date(estimate.validUntil).toLocaleDateString()}
          </p>
          <p className="text-gray-900 font-semibold mt-2">
            Total: ${estimate.total.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Line Items</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {estimate.lineItems.map((li) => (
              <tr key={li.id}>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {li.description}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">
                  {li.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-700">
                  ${li.unitPrice.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                  ${li.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        Phase 1 stub: Actions like edit, send, and convert to invoice will be
        implemented in Phase 2.
      </div>
    </div>
  );
}
