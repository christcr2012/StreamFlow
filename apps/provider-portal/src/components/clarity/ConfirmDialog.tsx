"use client";
import React from "react";

export function ConfirmDialog({
  summary,
  onConfirm,
  children,
}: {
  summary: string;
  onConfirm: () => Promise<void> | void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const handle = async () => {
    try {
      setBusy(true);
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className="px-3 py-2 rounded border"
        style={{ borderColor: 'var(--border-accent)' }}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border p-4" style={{ background:'var(--glass-bg)', borderColor:'var(--border-accent)' }}>
            <div className="text-sm" style={{ color:'var(--text-primary)' }}>{summary}</div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" style={{ borderColor:'var(--border-accent)' }} onClick={()=>setOpen(false)} disabled={busy}>Cancel</button>
              <button className="px-3 py-2 rounded" style={{ background:'var(--brand-primary)', color:'var(--bg-main)' }} onClick={handle} disabled={busy}>{busy? 'Working...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

