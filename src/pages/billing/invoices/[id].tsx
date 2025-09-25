// src/pages/billing/invoices/[id].tsx
import Head from "next/head";
import { useRouter } from "next/router";
import useSWR from "swr";
import Link from "next/link";
import { useMe } from "@/lib/useMe";
import { useState } from "react";

type Line = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  amountCents: number;
  leadId: string;
  leadPublicId: string | null;
};

type Invoice = {
  id: string;
  number: string;
  periodFrom: string;
  periodTo: string;
  status: string;
  currency: string;
  totalCents: number;
  createdAt: string;
  lines: Line[];
};

type ApiResp = { ok: true; invoice: Invoice } | { ok: false; error: string };

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function money(cents: number, currency = "usd") {
  const v = cents / 100;
  return v.toLocaleString(undefined, { style: "currency", currency: currency.toUpperCase() });
}

export default function InvoiceDetail() {
  const { query } = useRouter();
  const id = typeof query.id === "string" ? query.id : undefined;

  const { me } = useMe();
  const rbac: string[] =
    (me?.rbacRoles as string[]) ||
    (me?.perms as string[]) ||
    (Array.isArray((me as any)?.roles) ? (me as any).roles : []) ||
    [];
  const canManageBilling = rbac.includes("billing:manage") || rbac.includes("BILLING_MANAGE");

  const { data, error, isLoading, mutate } = useSWR<ApiResp>(
    () => (id ? `/api/billing/get?id=${encodeURIComponent(id)}` : null),
    fetcher,
    { refreshInterval: 30000 }
  );

  const inv = data && "ok" in data && data.ok ? (data.invoice as Invoice) : null;
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (!id) return;
    setMsg(null);
    setSending(true);
    try {
      const res = await fetch("/api/integrations/stripe/create-hosted-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMsg("Hosted invoice created/sent via Stripe.");
      await mutate();
    } catch (e: unknown) {
      const m = (e as { message?: string })?.message || "Failed to send via Stripe";
      setMsg(m);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Head><title>Invoice Details</title></Head>
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold">
            Invoice {inv?.number ?? (id ? `#${id.slice(0, 8)}…` : "")}
          </h1>
          <Link href="/billing/invoices" className="text-blue-600">← Back to Invoices</Link>
        </div>

        {isLoading && <div className="text-gray-600">Loading…</div>}
        {error && <div className="text-red-600">Error loading invoice.</div>}
        {!inv && !isLoading && !error && (
          <div className="text-gray-600">Invoice not found.</div>
        )}

        {inv && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="border rounded p-3">
                <div className="text-xs text-gray-600">Period</div>
                <div className="font-semibold">
                  {inv.periodFrom.slice(0, 10)} → {inv.periodTo.slice(0, 10)}
                </div>
              </div>
              <div className="border rounded p-3">
                <div className="text-xs text-gray-600">Status</div>
                <div className="font-semibold">{inv.status}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-xs text-gray-600">Total</div>
                <div className="font-semibold">{money(inv.totalCents, inv.currency)}</div>
              </div>
            </div>

            <div className="overflow-x-auto border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Lead</th>
                    <th className="text-right p-2">Qty</th>
                    <th className="text-right p-2">Unit</th>
                    <th className="text-right p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-6 text-gray-500">No line items.</td>
                    </tr>
                  ) : (
                    inv.lines.map((ln) => (
                      <tr key={ln.id} className="border-t">
                        <td className="p-2">{ln.description}</td>
                        <td className="p-2">{ln.leadPublicId || ln.leadId}</td>
                        <td className="p-2 text-right">{ln.quantity}</td>
                        <td className="p-2 text-right">{money(ln.unitPriceCents, inv.currency)}</td>
                        <td className="p-2 text-right">{money(ln.amountCents, inv.currency)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              {canManageBilling ? (
                <button
                  onClick={send}
                  disabled={sending}
                  className="px-3 py-2 rounded bg-black text-white"
                  title="Create a Stripe hosted invoice for this draft"
                >
                  {sending ? "Sending…" : "Send via Stripe"}
                </button>
              ) : (
                <span className="text-sm text-gray-500">Contact your provider to send this invoice.</span>
              )}
              {msg && <span className="text-sm text-gray-700">{msg}</span>}
            </div>
          </>
        )}
      </div>
    </>
  );
}
