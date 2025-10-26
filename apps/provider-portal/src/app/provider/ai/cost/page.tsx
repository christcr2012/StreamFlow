'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Budget {
  id: string;
  monthlyBudget: number;
  currentSpend: number;
  alertThreshold: number; // percentage
  hardLimit: boolean;
  resetDay: number; // day of month
  status: 'healthy' | 'warning' | 'critical';
}

interface AlertItem {
  id: string;
  orgId?: string;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  createdAt: string;
  acknowledged: boolean;
}

export default function ProviderAICostPage() {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [b, a] = await Promise.all([
          fetch('/api/ai/budget').then((r) => r.json()),
          fetch('/api/ai/alerts').then((r) => r.json()),
        ]);
        setBudget(b);
        setAlerts(a.alerts || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load AI cost data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!budget) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/ai/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyBudget: budget.monthlyBudget,
          alertThreshold: budget.alertThreshold,
          hardLimit: budget.hardLimit,
          resetDay: budget.resetDay,
        }),
      });
      if (!res.ok) throw new Error('Failed to update budget');
      const j = await res.json();
      setSuccess('Budget settings updated');
      setBudget((prev) => (prev ? { ...prev, ...j.updated } : prev));
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update budget');
    } finally {
      setSaving(false);
    }
  };

  const acknowledgeAll = async () => {
    try {
      await fetch('/api/ai/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: alerts.map((a) => a.id) }),
      });
      setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
    } catch (e) {
      // non-blocking
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: 'var(--brand-gradient)' }}>
          AI Cost Management
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Configure global AI budget policies and review system-wide alerts.
        </p>
        <div className="mt-3 text-sm">
          <Link href="/provider/ai" className="underline" style={{ color: 'var(--brand-primary)' }}>Back to AI Overview</Link>
        </div>
      </header>

      {loading ? (
        <div className="premium-card spacing-responsive-sm">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading AI cost data...</p>
        </div>
      ) : error ? (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
          <p className="text-sm" style={{ color: 'var(--error-text)' }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Budget Summary */}
          {budget && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-xl p-5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Monthly Budget</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>${budget.monthlyBudget.toFixed(2)}</div>
              </div>
              <div className="rounded-xl p-5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Current Spend</div>
                <div className="text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>${budget.currentSpend.toFixed(2)}</div>
              </div>
              <div className="rounded-xl p-5" style={{ background: 'var(--glass-bg)', border: '1px solid var(--border-accent)' }}>
                <div className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Status</div>
                <div className="text-2xl font-bold capitalize" style={{ color: 'var(--brand-primary)' }}>{budget.status}</div>
              </div>
            </div>
          )}

          {/* Budget Form */}
          {budget && (
            <div className="premium-card spacing-responsive-sm">
              <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Budget Policy</h2>
              {success && (
                <div className="mb-4 rounded-md p-3" style={{ backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                  <span className="text-sm" style={{ color: 'var(--success-text)' }}>{success}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Monthly Budget (USD)</label>
                  <input
                    type="number"
                    className="input-field touch-target w-full"
                    value={budget.monthlyBudget}
                    onChange={(e) => setBudget({ ...budget, monthlyBudget: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Alert Threshold (%)</label>
                  <input
                    type="number"
                    className="input-field touch-target w-full"
                    value={budget.alertThreshold}
                    onChange={(e) => setBudget({ ...budget, alertThreshold: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Hard Limit</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={budget.hardLimit}
                      onChange={(e) => setBudget({ ...budget, hardLimit: e.target.checked })}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Block AI usage after budget reached</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Reset Day (1-28)</label>
                  <input
                    type="number"
                    className="input-field touch-target w-full"
                    min={1}
                    max={28}
                    value={budget.resetDay}
                    onChange={(e) => setBudget({ ...budget, resetDay: Math.max(1, Math.min(28, Number(e.target.value))) })}
                  />
                </div>
              </div>

              <button className="btn-primary touch-target-comfortable mt-4" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving...' : 'Save Budget Policy'}
              </button>
            </div>
          )}

          {/* Alerts */}
          <div className="premium-card spacing-responsive-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>System Alerts</h2>
              {alerts.length > 0 && (
                <button className="btn-secondary" onClick={acknowledgeAll}>Acknowledge All</button>
              )}
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No alerts</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <div key={a.id} className="flex items-start justify-between p-3 rounded-lg"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border-accent)' }}>
                    <div>
                      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                        <span className="font-semibold capitalize" style={{ color: 'var(--brand-primary)' }}>{a.severity}</span> • {a.message}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{new Date(a.createdAt).toLocaleString()}</div>
                    </div>
                    <div>
                      {a.acknowledged ? (
                        <span className="text-xs px-2 py-1 rounded" style={{ color: 'var(--success-text)', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>Acknowledged</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded" style={{ color: 'var(--warning-text)', backgroundColor: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>Active</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
