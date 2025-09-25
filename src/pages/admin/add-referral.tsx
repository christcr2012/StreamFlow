// src/pages/admin/add-referral.tsx
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMe } from "@/lib/useMe";

/**
 * AddReferralPage allows an owner to manually add an employee referral lead.
 * Employee referrals are non-billable by design. The form submits to
 * /api/leads with sourceType="EMPLOYEE_REFERRAL". Only owners can access
 * this page; other roles are redirected or shown a forbidden message.
 */
export default function AddReferralPage() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceCode, setServiceCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Add Referral • Admin";
  }, []);

  // Only owners may add referrals. Providers and others see a forbidden message.
  if (loading) return <p className="p-6">Loading…</p>;
  if (!me?.isOwner) return <div className="p-6 text-red-600">Forbidden</div>;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const body: {
        sourceType: string;
        company: string | null;
        contactName: string | null;
        email: string | null;
        phoneE164: string | null;
        serviceCode: string | null;
      } = {
        sourceType: "EMPLOYEE_REFERRAL",
        company: company || null,
        contactName: contactName || null,
        email: email || null,
        phoneE164: phone || null,
        serviceCode: serviceCode || null,
      };
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok || j.ok === false) throw new Error(j.error || `HTTP ${res.status}`);
      setMsg("Referral added successfully.");
      // Optionally redirect to leads list after a short delay
      setTimeout(() => {
        router.push("/leads");
      }, 1200);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Save failed";
      setErr(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head><title>Add Referral</title></Head>
      <div className="mx-auto max-w-[600px] px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold">Add Employee Referral</h1>
        <p className="text-sm text-gray-600">Use this form to add a new employee referral. Referrals are non-billable leads.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <input className="border rounded px-3 py-2 w-full" value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Name</label>
            <input className="border rounded px-3 py-2 w-full" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Contact person" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="border rounded px-3 py-2 w-full" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone (E.164)</label>
            <input className="border rounded px-3 py-2 w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Service Code/Description</label>
            <input className="border rounded px-3 py-2 w-full" value={serviceCode} onChange={e => setServiceCode(e.target.value)} placeholder="e.g. janitorial" />
          </div>
          {msg && <div className="text-emerald-700">{msg}</div>}
          {err && <div className="text-red-600">{err}</div>}
          <div>
            <button type="submit" disabled={saving} className="rounded bg-black text-white px-4 py-2">
              {saving ? "Saving…" : "Add Referral"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}