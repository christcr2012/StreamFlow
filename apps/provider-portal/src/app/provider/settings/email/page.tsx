"use client";

import { useEffect, useState } from "react";

export default function ProviderEmailSettingsPage() {
  const [status, setStatus] = useState<{ connected: boolean; email?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [testTo, setTestTo] = useState("");
  const [subject, setSubject] = useState("Hello from Provider Portal");
  const [body, setBody] = useState("<p>This is a test email sent via Gmail OAuth.</p>");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/provider/email/status");
        const j = await res.json();
        setStatus(j);
      } catch (e: any) {
        setStatus({ connected: false, error: e?.message || "Failed to load status" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const connect = () => {
    window.location.href = "/api/provider/email/connect/start";
  };

  const testSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/provider/email/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testTo, subject, body }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Send failed");
      setResult("Sent ✔");
    } catch (e: any) {
      setResult(`Error: ${e?.message || "Unknown"}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-responsive spacing-responsive-md">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Provider Email (Gmail OAuth)</h1>
        <p className="text-responsive-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          Connect a Gmail account (gmail.send only) to send provider-level emails.
        </p>
      </div>

      <div className="premium-card spacing-responsive-sm space-y-4">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading status…</p>
        ) : (
          <div className="space-y-2">
            <p className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>
              Status: {status?.connected ? "Connected" : "Not Connected"}
            </p>
            {status?.email && (
              <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>Connected as: {status.email}</p>
            )}
            {!status?.connected && (
              <button className="btn-primary touch-target-comfortable" onClick={connect}>Connect Gmail</button>
            )}
          </div>
        )}
      </div>

      <div className="premium-card spacing-responsive-sm space-y-4 mt-6">
        <h2 className="text-responsive-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Test Send</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-responsive-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>To</label>
            <input className="input-field w-full" type="email" value={testTo} onChange={(e)=>setTestTo(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-responsive-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject</label>
            <input className="input-field w-full" value={subject} onChange={(e)=>setSubject(e.target.value)} />
          </div>
          <div>
            <label className="block text-responsive-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Body (HTML)</label>
            <textarea className="input-field w-full min-h-[120px]" value={body} onChange={(e)=>setBody(e.target.value)} />
          </div>
          <button disabled={sending || !status?.connected} className="btn-primary touch-target-comfortable" onClick={testSend}>
            {sending ? 'Sending…' : 'Send Test Email'}
          </button>
          {result && (
            <div className="text-responsive-sm" style={{ color: result.startsWith('Error') ? 'var(--error-text)' : 'var(--success-text)' }}>
              {result}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

