import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getBillingSummary,
  getDunningQueue,
  type BillingSummary,
} from "@/services/provider/billing.service";
import DunningRunButtonClient from "./DunningRunButtonClient";
import BillingUpdateForm from "./BillingUpdateForm";

export default async function ProviderBillingPage() {
  const jar = await cookies();
  if (
    !jar.get("rs_provider") &&
    !jar.get("provider-session") &&
    !jar.get("ws_provider")
  ) {
    redirect("/provider/login");
  }

  // Handle build-time gracefully (no DATABASE_URL available)
  let summary: BillingSummary = {
    totalRevenueCents: 0,
    revenueByStream: [],
    unbilledLeads: 0,
    unbilledRevenueCents: 0,
    dunningCount: 0,
  };
  let dunning: any[] = [];

  try {
    [summary, dunning] = await Promise.all([
      getBillingSummary(),
      getDunningQueue(),
    ]);
  } catch (error) {
    console.log(
      "Billing page: Database not available during build, using empty data",
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl font-bold bg-clip-text text-transparent mb-2"
          style={{ backgroundImage: "var(--brand-gradient)" }}
        >
          Billing & Reconciliation
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Manage invoices, payments, and financial reconciliation across all
          clients
        </p>
      </div>

      {/* Billing Update Form */}
      <BillingUpdateForm />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div />
        <DunningRunButtonClient />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Total Revenue
          </div>
          <div
            className="text-3xl font-bold mt-2"
            style={{ color: "var(--brand-primary)" }}
          >
            ${(summary.totalRevenueCents / 100).toLocaleString()}
          </div>
        </div>
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Unbilled Leads
          </div>
          <div
            className="text-3xl font-bold mt-2"
            style={{ color: "var(--brand-primary)" }}
          >
            {summary.unbilledLeads}
          </div>
        </div>
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Unbilled Revenue
          </div>
          <div
            className="text-3xl font-bold mt-2"
            style={{ color: "var(--brand-primary)" }}
          >
            ${(summary.unbilledRevenueCents / 100).toLocaleString()}
          </div>
        </div>
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--glass-bg)",
            border: "1px solid var(--border-accent)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Dunning Queue
          </div>
          <div
            className="text-3xl font-bold mt-2"
            style={{ color: "var(--brand-primary)" }}
          >
            {summary.dunningCount}
          </div>
        </div>
      </div>

      {/* Dunning Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: "var(--glass-bg)",
          border: "1px solid var(--border-accent)",
        }}
      >
        <div
          className="p-4 border-b"
          style={{ borderColor: "var(--border-accent)" }}
        >
          <div
            className="text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            Dunning Queue
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-accent)" }}>
              <th
                className="text-left p-4 text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Invoice
              </th>
              <th
                className="text-left p-4 text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Organization
              </th>
              <th
                className="text-left p-4 text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Amount
              </th>
              <th
                className="text-left p-4 text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Due
              </th>
              <th
                className="text-left p-4 text-sm font-semibold"
                style={{ color: "var(--text-secondary)" }}
              >
                Attempts
              </th>
            </tr>
          </thead>
          <tbody>
            {dunning.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nothing in dunning
                </td>
              </tr>
            ) : (
              dunning.map((row) => (
                <tr
                  key={row.invoiceId}
                  style={{ borderBottom: "1px solid var(--border-accent)" }}
                >
                  <td className="p-4" style={{ color: "var(--text-primary)" }}>
                    <a
                      href={`/api/provider/invoices/${row.invoiceId}/html`}
                      target="_blank"
                      className="underline"
                    >
                      {row.invoiceId}
                    </a>
                    <span
                      className="mx-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      |
                    </span>
                    <a
                      href={`/api/provider/invoices/${row.invoiceId}/pdf`}
                      target="_blank"
                      className="underline"
                    >
                      PDF
                    </a>
                  </td>
                  <td className="p-4" style={{ color: "var(--text-primary)" }}>
                    {row.orgName}
                  </td>
                  <td className="p-4" style={{ color: "var(--text-primary)" }}>
                    ${(row.amountCents / 100).toFixed(2)}
                  </td>
                  <td
                    className="p-4 text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {new Date(row.dueDate).toLocaleDateString()}
                  </td>
                  <td
                    className="p-4 flex items-center gap-3"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span>{row.attemptCount}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs`}
                      style={{
                        background:
                          row.attemptCount > 0
                            ? "rgba(245, 158, 11, 0.15)"
                            : "var(--glass-bg)",
                        border: "1px solid var(--border-accent)",
                        color:
                          row.attemptCount > 0
                            ? "#f59e0b"
                            : "var(--text-secondary)",
                      }}
                    >
                      {row.attemptCount > 0 ? "Retrying" : "New"}
                    </span>
                    <form
                      action="/api/provider/billing/retry"
                      method="post"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const f = e.target as HTMLFormElement;
                        await fetch(f.action, {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ invoiceId: row.invoiceId }),
                        });
                      }}
                    >
                      <button
                        className="px-3 py-1 rounded text-xs"
                        style={{
                          background: "var(--brand-primary)",
                          color: "var(--bg-main)",
                        }}
                      >
                        Retry
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
