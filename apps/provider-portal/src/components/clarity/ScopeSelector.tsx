"use client";
import React from "react";
import { ScopeLevel, ScopeBadge } from "./ScopeBadge";

export type Scope =
  | { type: "provider" }
  | { type: "plan"; planId: string; planName?: string }
  | { type: "tenant"; orgId: string; orgName?: string };

export function ScopeSelector({
  value,
  onChange,
  planOptions,
  orgOptions,
}: {
  value: Scope;
  onChange: (scope: Scope) => void;
  planOptions: Array<{ id: string; name: string }>;
  orgOptions: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="rounded-xl border p-3" style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-accent)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScopeBadge level={value.type as ScopeLevel} label={
            value.type === 'plan' ? (value.planName || value.planId) : value.type === 'tenant' ? (value.orgName || value.orgId) : undefined
          } />
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Select where this change applies.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="px-2 py-1 rounded border text-sm"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-accent)' }}
            value={value.type}
            onChange={(e) => {
              const t = e.target.value as ScopeLevel;
              if (t === 'provider') onChange({ type: 'provider' });
              if (t === 'plan') onChange({ type: 'plan', planId: '' });
              if (t === 'tenant') onChange({ type: 'tenant', orgId: '' });
            }}
          >
            <option value="provider">Provider (global)</option>
            <option value="plan">Plan</option>
            <option value="tenant">Tenant</option>
          </select>

          {value.type === 'plan' && (
            <select
              className="px-2 py-1 rounded border text-sm"
              style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-accent)' }}
              value={value.planId}
              onChange={(e) => onChange({ type: 'plan', planId: e.target.value })}
            >
              <option value="">Select plan</option>
              {planOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {value.type === 'tenant' && (
            <select
              className="px-2 py-1 rounded border text-sm"
              style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-accent)' }}
              value={(value as any).orgId}
              onChange={(e) => onChange({ type: 'tenant', orgId: e.target.value })}
            >
              <option value="">Select tenant</option>
              {orgOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}

