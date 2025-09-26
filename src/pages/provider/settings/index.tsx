// src/pages/provider/settings/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useMe } from '@/lib/useMe';
import { useRouter } from 'next/router';

type ProviderSettings = {
  companyName: string;
  contactEmail: string;
  maxAiCostPerMonth: number;
  defaultLeadPrice: number;
  autoProvisionClients: boolean;
  enableFederatedPortal: boolean;
  federatedPortalUrl: string | null;
  notificationSettings: {
    costAlerts: boolean;
    revenueReports: boolean;
    clientActivity: boolean;
    systemUpdates: boolean;
  };
  billingSettings: {
    invoicePrefix: string;
    paymentTermsDays: number;
    lateFeePercentage: number;
    autoCollections: boolean;
  };
};

export default function ProviderSettingsPage() {
  const { me, loading } = useMe();
  const router = useRouter();
  const [settings, setSettings] = useState<ProviderSettings | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Redirect non-providers
  useEffect(() => {
    if (!loading && me?.role !== 'PROVIDER') {
      router.push('/dashboard');
    }
  }, [me, loading, router]);

  useEffect(() => {
    if (me?.role === 'PROVIDER') {
      fetchSettings();
    }
  }, [me]);

  const fetchSettings = async () => {
    try {
      setLoadingData(true);
      const response = await fetch('/api/provider/settings');
      const data = await response.json();
      
      if (data.ok) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch('/api/provider/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      
      const result = await response.json();
      
      if (result.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateSettings = (updates: Partial<ProviderSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const updateNotificationSettings = (updates: Partial<ProviderSettings['notificationSettings']>) => {
    if (settings) {
      setSettings({
        ...settings,
        notificationSettings: { ...settings.notificationSettings, ...updates }
      });
    }
  };

  const updateBillingSettings = (updates: Partial<ProviderSettings['billingSettings']>) => {
    if (settings) {
      setSettings({
        ...settings,
        billingSettings: { ...settings.billingSettings, ...updates }
      });
    }
  };

  if (loading || me?.role !== 'PROVIDER') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent mx-auto mb-4" 
               style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Provider Settings • Provider Portal</title>
      </Head>
      
      <div className="max-w-[1000px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/provider" className="text-sm" style={{ color: 'var(--brand-primary)' }}>
                ← Provider Portal
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gradient">Provider Settings</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Configure provider-level settings and federation options
            </p>
          </div>
          
          <button 
            onClick={saveSettings}
            disabled={saving || !settings}
            className="btn-primary"
          >
            <span>{saving ? '💾 Saving...' : '💾 Save Settings'}</span>
          </button>
        </div>

        {/* Status Message */}
        {message && (
          <div 
            className={`px-4 py-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Company Information */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Company Information</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Basic provider company details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Company Name
              </label>
              <input
                type="text"
                value={settings?.companyName || ''}
                onChange={(e) => updateSettings({ companyName: e.target.value })}
                className="input-field"
                placeholder="Mountain Vista Lead Services"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Contact Email
              </label>
              <input
                type="email"
                value={settings?.contactEmail || ''}
                onChange={(e) => updateSettings({ contactEmail: e.target.value })}
                className="input-field"
                placeholder="provider@mountain-vista.com"
              />
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Business Settings</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Core business configuration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Default Lead Price ($)
              </label>
              <input
                type="number"
                value={settings?.defaultLeadPrice || 100}
                onChange={(e) => updateSettings({ defaultLeadPrice: Number(e.target.value) })}
                className="input-field"
                min="1"
                max="1000"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Revenue per converted lead
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Max AI Cost per Month ($)
              </label>
              <input
                type="number"
                value={settings?.maxAiCostPerMonth || 50}
                onChange={(e) => updateSettings({ maxAiCostPerMonth: Number(e.target.value) })}
                className="input-field"
                min="10"
                max="200"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Hard limit for AI processing costs
              </p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoProvision"
                  checked={settings?.autoProvisionClients || false}
                  onChange={(e) => updateSettings({ autoProvisionClients: e.target.checked })}
                  className="w-4 h-4 rounded border-2"
                  style={{ 
                    borderColor: 'var(--border-accent)',
                    accentColor: 'var(--brand-primary)'
                  }}
                />
                <label htmlFor="autoProvision" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-medium">Auto-provision new clients</span>
                  <span className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Automatically create client organizations from signup requests
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Federation Settings */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Federation Settings</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                External provider portal configuration
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enableFederation"
                checked={settings?.enableFederatedPortal || false}
                onChange={(e) => updateSettings({ enableFederatedPortal: e.target.checked })}
                className="w-4 h-4 rounded border-2"
                style={{ 
                  borderColor: 'var(--border-accent)',
                  accentColor: 'var(--brand-primary)'
                }}
              />
              <label htmlFor="enableFederation" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-medium">Enable Federated Provider Portal</span>
                <span className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Allow external provider portal to manage this instance
                </span>
              </label>
            </div>

            {settings?.enableFederatedPortal && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  External Portal URL
                </label>
                <input
                  type="url"
                  value={settings?.federatedPortalUrl || ''}
                  onChange={(e) => updateSettings({ federatedPortalUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://provider.mountain-vista.com"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  URL of the external provider portal system
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Notification Settings</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Configure email and system notifications
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="costAlerts"
                  checked={settings?.notificationSettings.costAlerts || false}
                  onChange={(e) => updateNotificationSettings({ costAlerts: e.target.checked })}
                  className="w-4 h-4 rounded border-2"
                  style={{ 
                    borderColor: 'var(--border-accent)',
                    accentColor: 'var(--brand-primary)'
                  }}
                />
                <label htmlFor="costAlerts" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  AI Cost Alerts
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="revenueReports"
                  checked={settings?.notificationSettings.revenueReports || false}
                  onChange={(e) => updateNotificationSettings({ revenueReports: e.target.checked })}
                  className="w-4 h-4 rounded border-2"
                  style={{ 
                    borderColor: 'var(--border-accent)',
                    accentColor: 'var(--brand-primary)'
                  }}
                />
                <label htmlFor="revenueReports" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Monthly Revenue Reports
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="clientActivity"
                  checked={settings?.notificationSettings.clientActivity || false}
                  onChange={(e) => updateNotificationSettings({ clientActivity: e.target.checked })}
                  className="w-4 h-4 rounded border-2"
                  style={{ 
                    borderColor: 'var(--border-accent)',
                    accentColor: 'var(--brand-primary)'
                  }}
                />
                <label htmlFor="clientActivity" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Client Activity Updates
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="systemUpdates"
                  checked={settings?.notificationSettings.systemUpdates || false}
                  onChange={(e) => updateNotificationSettings({ systemUpdates: e.target.checked })}
                  className="w-4 h-4 rounded border-2"
                  style={{ 
                    borderColor: 'var(--border-accent)',
                    accentColor: 'var(--brand-primary)'
                  }}
                />
                <label htmlFor="systemUpdates" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  System Updates
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Settings */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full" style={{ background: 'var(--brand-gradient)' }}></div>
            <div>
              <h2 className="text-xl font-semibold text-gradient">Billing Configuration</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Invoice and payment settings
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings?.billingSettings.invoicePrefix || 'MV'}
                onChange={(e) => updateBillingSettings({ invoicePrefix: e.target.value })}
                className="input-field"
                placeholder="MV"
                maxLength={5}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Payment Terms (Days)
              </label>
              <input
                type="number"
                value={settings?.billingSettings.paymentTermsDays || 30}
                onChange={(e) => updateBillingSettings({ paymentTermsDays: Number(e.target.value) })}
                className="input-field"
                min="1"
                max="90"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Late Fee Percentage (%)
              </label>
              <input
                type="number"
                value={settings?.billingSettings.lateFeePercentage || 1.5}
                onChange={(e) => updateBillingSettings({ lateFeePercentage: Number(e.target.value) })}
                className="input-field"
                min="0"
                max="10"
                step="0.1"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoCollections"
                checked={settings?.billingSettings.autoCollections || false}
                onChange={(e) => updateBillingSettings({ autoCollections: e.target.checked })}
                className="w-4 h-4 rounded border-2"
                style={{ 
                  borderColor: 'var(--border-accent)',
                  accentColor: 'var(--brand-primary)'
                }}
              />
              <label htmlFor="autoCollections" className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <span className="font-medium">Auto Collections</span>
                <span className="block text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Automatically attempt payment collection
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="premium-card border-red-500/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-2 h-8 rounded-full bg-red-500"></div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--accent-danger)' }}>Danger Zone</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Irreversible actions that affect all clients
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to reset all AI cost tracking? This cannot be undone.')) {
                  // Reset AI costs
                }
              }}
              className="btn-outline border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <span>Reset AI Costs</span>
            </button>
            
            <button 
              onClick={() => {
                if (confirm('Are you sure you want to export all provider data? This will generate a complete data export.')) {
                  // Export data
                }
              }}
              className="btn-outline border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
            >
              <span>Export All Data</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}