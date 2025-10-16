"use client";
import React from "react";

export function HelpDrawer({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="px-2 py-1 text-xs rounded border"
        style={{ borderColor: 'var(--border-accent)' }}
        onClick={() => setOpen(true)}
        aria-label={`Open help for ${title}`}
      >
        Help
      </button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--bg-panel)] border-l" style={{ borderColor: 'var(--border-accent)' }}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-accent)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</div>
              <button className="text-sm opacity-70 hover:opacity-100" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {children}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

