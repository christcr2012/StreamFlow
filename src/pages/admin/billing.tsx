// src/pages/admin/billing.tsx
import { useEffect, useState } from "react";
import Head from "next/head";
import { useMe } from "@/lib/useMe";

type Preview = {
  ok: boolean;
  count: number;
  totalCents: number;
  totalDollars: string;
  items: {
    id: string;
    publicId: string | null;
    company: string | null;
    sourceType: string;
    createdAt: string;
    unitPriceCents: number;
  }[];
};

/**
 * BillingPage displays a preview of billable converted leads and allows the admin
 * to create a monthly invoice. Only owners/providers can access this page.
 */
export default function BillingPage() {
  const { me, loading } = useMe();
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Preview | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [month, setMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    document.title = "Billing • Mountain Vista";
  }, []);

  const forbidden = !loading && !(me?.isOwner || me?.isProvider);

  async function refresh() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await fetch("/api/billing/preview");
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
      setData(j);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load preview";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  async function createInvoice() {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await fetch("/api/billing/invoices.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodDate: month + "-01" }),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || `HTTP ${r.status}`);
      setMsg(`Created invoice ${j.number} with ${j.lines} line(s).`);
      await refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create invoice";
      setErr(message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="p-6">Loading…</p>;
  if (forbidden) return <div className="p-6 text-red-600">Forbidden</div>;

  return (
    <>
      <Head><title>Billing</title></Head>
      <div className="mx-auto max-w-[1000px] px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Billing</h1>
          <div className="flex items-center gap-3">
            <input
              type="month"
              className="border rounded px-3 py-2"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <button onClick={refresh} disabled={busy} className="rounded bg-black text-white px-4 py-2">
              {busy ? "Loading..." : "Refresh Preview"}
            </button>
            <button onClick={createInvoice} disabled={busy} className="rounded bg-emerald-600 text-white px-4 py-2">
              {busy ? "Working..." : "Create Invoice"}
            </button>
          </div>
        </div>
        {msg && <div className="text-emerald-700">{msg}</div>}
        {err && <div className="text-red-600">{err}</div>}
        {!data ? (
          <p className="text-gray-600">Click “Refresh Preview” to see billable leads.</p>
        ) : (
          <>
            <p className="text-sm text-gray-700">Count: {data.count} • Total: ${data.totalDollars}</p>
            <div className="rounded border">
              <div className="grid grid-cols-5 gap-2 p-2 font-medium bg-gray-50">
                <div>Public ID</div>
                <div>Company</div>
                <div>Source</div>
                <div>Created</div>
                <div>Price</div>
              </div>
              {data.items.map((it) => (
                <div key={it.id} className="grid grid-cols-5 gap-2 p-2 border-t">
                  <div>{it.publicId}</div>
                  <div>{it.company ?? "—"}</div>
                  <div>{it.sourceType}</div>
                  <div>{new Date(it.createdAt).toLocaleDateString()}</div>
                  <div>${(it.unitPriceCents / 100).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}