'use client';

import { useState, useEffect } from 'react';
import { ThemeSwitcher } from "@/components/dev-aids/ThemeSwitcher";

interface ProviderSettings {
  providerName?: string;
  contactEmail?: string;
  supportUrl?: string;
  notificationSettings?: {
    emailAlerts: boolean;
    slackNotifications: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
  };
  securitySettings?: {
    twoFactorEnabled: boolean;
    sessionTimeoutMinutes: number;
    ipWhitelist: string[];
  };
  integrationSettings?: {
    stripeConfigured: boolean;
    samGovConfigured: boolean;
    apiRateLimit: number;
  };
}

export default function ProviderSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'integrations'>('general');

  return (
    <div className="container-responsive spacing-responsive-md">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Provider Settings
        </h1>
        <p className="text-responsive-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          Configure your provider portal preferences and settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b mb-6" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={() => setActiveTab('general')}
          className="px-4 py-2 font-medium transition-colors touch-target"
          style={{
            color: activeTab === 'general' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'general' ? '2px solid var(--brand-primary)' : 'none'
          }}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className="px-4 py-2 font-medium transition-colors touch-target"
          style={{
            color: activeTab === 'security' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'security' ? '2px solid var(--brand-primary)' : 'none'
          }}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className="px-4 py-2 font-medium transition-colors touch-target"
          style={{
            color: activeTab === 'notifications' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'notifications' ? '2px solid var(--brand-primary)' : 'none'
          }}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className="px-4 py-2 font-medium transition-colors touch-target"
          style={{
            color: activeTab === 'integrations' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'integrations' ? '2px solid var(--brand-primary)' : 'none'
          }}
        >
          Integrations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && <GeneralSettings />}
      {activeTab === 'security' && <SecuritySettings />}
      {activeTab === 'notifications' && <NotificationSettings />}
      {activeTab === 'integrations' && <IntegrationSettings />}
    </div>
  );
}

// General Settings Component
function GeneralSettings() {
  const [providerName, setProviderName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [supportUrl, setSupportUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/provider/settings');
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        const data: ProviderSettings = await response.json();
        setProviderName(data.providerName || '');
        setContactEmail(data.contactEmail || '');
        setSupportUrl(data.supportUrl || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/provider/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName,
          contactEmail,
          supportUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="premium-card spacing-responsive-sm">
          <p className="text-responsive-base" style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
          <p className="text-responsive-sm" style={{ color: 'var(--error-text)' }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-border)' }}>
          <p className="text-responsive-sm" style={{ color: 'var(--success-text)' }}>{success}</p>
        </div>
      )}

      {/* Theme Settings */}
      <div className="premium-card spacing-responsive-sm">
        <h2 className="text-responsive-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Theme Customization</h2>
        <p className="text-responsive-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          Choose a theme for the Provider portal. This setting is separate from client-side themes.
        </p>
        <ThemeSwitcher scope="admin" />
      </div>

      {/* Provider Information */}
      <div className="premium-card spacing-responsive-sm">
        <h2 className="text-responsive-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Provider Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="providerName" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Provider Name
            </label>
            <input
              type="text"
              id="providerName"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="input-field touch-target w-full"
              placeholder="Cortiware Provider"
            />
          </div>

          <div>
            <label htmlFor="contactEmail" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Contact Email
            </label>
            <input
              type="email"
              id="contactEmail"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="input-field touch-target w-full"
              placeholder="provider@cortiware.com"
            />
          </div>

          <div>
            <label htmlFor="supportUrl" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Support URL
            </label>
            <input
              type="url"
              id="supportUrl"
              value={supportUrl}
              onChange={(e) => setSupportUrl(e.target.value)}
              className="input-field touch-target w-full"
              placeholder="https://support.cortiware.com"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary touch-target-comfortable"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Security Settings Component
function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load security settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/provider/settings');
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        const data: ProviderSettings = await response.json();
        setTwoFactorEnabled(data.securitySettings?.twoFactorEnabled || false);
        setSessionTimeout(String(data.securitySettings?.sessionTimeoutMinutes || 30));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // TODO: Implement password change API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleSecuritySave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/provider/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          securitySettings: {
            twoFactorEnabled,
            sessionTimeoutMinutes: Number(sessionTimeout),
            ipWhitelist: [] // TODO: Add IP whitelist UI
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      setSuccess('Security settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="premium-card spacing-responsive-sm">
          <p className="text-responsive-base" style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
          <p className="text-responsive-sm" style={{ color: 'var(--error-text)' }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-border)' }}>
          <p className="text-responsive-sm" style={{ color: 'var(--success-text)' }}>{success}</p>
        </div>
      )}

      {/* Password Change */}
      <div className="premium-card spacing-responsive-sm">
        <h2 className="text-responsive-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field touch-target w-full"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field touch-target w-full"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field touch-target w-full"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="btn-primary touch-target-comfortable"
          >
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="premium-card spacing-responsive-sm">
        <h2 className="text-responsive-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Two-Factor Authentication</h2>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="twoFactor"
            checked={twoFactorEnabled}
            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
            className="w-5 h-5"
          />
          <label htmlFor="twoFactor" className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>
            Enable Two-Factor Authentication
          </label>
        </div>
        <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
          Add an extra layer of security to your account by requiring a verification code in addition to your password.
        </p>
      </div>

      {/* Session Settings */}
      <div className="premium-card spacing-responsive-sm">
        <h2 className="text-responsive-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Session Settings</h2>
        <div>
          <label htmlFor="sessionTimeout" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Session Timeout (minutes)
          </label>
          <select
            id="sessionTimeout"
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="input-field touch-target w-full"
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
            <option value="240">4 hours</option>
          </select>
        </div>

        <button
          onClick={handleSecuritySave}
          disabled={saving}
          className="btn-primary touch-target-comfortable mt-4"
        >
          {saving ? 'Saving...' : 'Save Security Settings'}
        </button>
      </div>
    </div>
  );
}

// Notification Settings Component
function NotificationSettings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackNotifications, setSlackNotifications] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [monthlyReports, setMonthlyReports] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load notification settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/provider/settings');
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        const data: ProviderSettings = await response.json();
        setEmailAlerts(data.notificationSettings?.emailAlerts ?? true);
        setSlackNotifications(data.notificationSettings?.slackNotifications ?? false);
        setWeeklyReports(data.notificationSettings?.weeklyReports ?? true);
        setMonthlyReports(data.notificationSettings?.monthlyReports ?? true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/provider/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationSettings: {
            emailAlerts,
            slackNotifications,
            weeklyReports,
            monthlyReports
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      setSuccess('Notification settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="premium-card spacing-responsive-sm">
          <p className="text-responsive-base" style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
          <p className="text-responsive-sm" style={{ color: 'var(--error-text)' }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-border)' }}>
          <p className="text-responsive-sm" style={{ color: 'var(--success-text)' }}>{success}</p>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="premium-card spacing-responsive-sm">
        <h2 className="text-responsive-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="emailAlerts"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="emailAlerts" className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>
              Email Alerts
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="slackNotifications"
              checked={slackNotifications}
              onChange={(e) => setSlackNotifications(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="slackNotifications" className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>
              Slack Notifications
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="weeklyReports"
              checked={weeklyReports}
              onChange={(e) => setWeeklyReports(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="weeklyReports" className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>
              Weekly Reports
            </label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="monthlyReports"
              checked={monthlyReports}
              onChange={(e) => setMonthlyReports(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="monthlyReports" className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>
              Monthly Reports
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary touch-target-comfortable mt-4"
        >
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>

    </div>
  );
}

// Integration Settings Component
function IntegrationSettings() {
  const [stripeConfigured, setStripeConfigured] = useState(false);
  const [samGovConfigured, setSamGovConfigured] = useState(false);
  const [apiRateLimit, setApiRateLimit] = useState('1000');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load integration settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/provider/settings');
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        const data: ProviderSettings = await response.json();
        setStripeConfigured(data.integrationSettings?.stripeConfigured ?? false);
        setSamGovConfigured(data.integrationSettings?.samGovConfigured ?? false);
        setApiRateLimit(String(data.integrationSettings?.apiRateLimit || 1000));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/provider/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          integrationSettings: {
            stripeConfigured,
            samGovConfigured,
            apiRateLimit: Number(apiRateLimit)
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }

      setSuccess('Integration settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="premium-card spacing-responsive-sm">
          <p className="text-responsive-base" style={{ color: 'var(--text-secondary)' }}>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--error-bg)', borderColor: 'var(--error-border)' }}>
          <p className="text-responsive-sm" style={{ color: 'var(--error-text)' }}>{error}</p>
        </div>
      )}
      {success && (
        <div className="premium-card spacing-responsive-sm" style={{ backgroundColor: 'var(--success-bg)', borderColor: 'var(--success-border)' }}>
          <p className="text-responsive-sm" style={{ color: 'var(--success-text)' }}>{success}</p>
        </div>
      )}

      {/* Third-Party Integrations */}
      <div className="premium-card spacing-responsive-sm">
        <h2 className="text-responsive-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Third-Party Integrations</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="stripeConfigured"
              checked={stripeConfigured}
              onChange={(e) => setStripeConfigured(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="stripeConfigured" className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>
              Stripe Configured
            </label>
          </div>
          <p className="text-responsive-sm ml-8" style={{ color: 'var(--text-secondary)' }}>
            Configure Stripe API keys in the secure settings panel
          </p>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="samGovConfigured"
              checked={samGovConfigured}
              onChange={(e) => setSamGovConfigured(e.target.checked)}
              className="w-5 h-5"
            />
            <label htmlFor="samGovConfigured" className="text-responsive-base" style={{ color: 'var(--text-primary)' }}>
              SAM.gov Configured
            </label>
          </div>
          <p className="text-responsive-sm ml-8" style={{ color: 'var(--text-secondary)' }}>
            Configure SAM.gov API key in the secure settings panel
          </p>
        </div>
      </div>

          {/* Provider Email (Gmail OAuth) */}
          <div className="mt-2">
            <a href="/provider/settings/email" className="btn-secondary touch-target">Configure Provider Email (Gmail OAuth)</a>
          </div>


      {/* API Configuration */}
      <div className="premium-card spacing-responsive-sm">
        <h2 className="text-responsive-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>API Configuration</h2>
        <div>
          <label htmlFor="apiRateLimit" className="block text-responsive-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            API Rate Limit (requests per hour)
          </label>
          <select
            id="apiRateLimit"
            value={apiRateLimit}
            onChange={(e) => setApiRateLimit(e.target.value)}
            className="input-field touch-target w-full"
          >
            <option value="100">100 requests/hour</option>
            <option value="500">500 requests/hour</option>
            <option value="1000">1,000 requests/hour</option>
            <option value="5000">5,000 requests/hour</option>
            <option value="10000">10,000 requests/hour</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary touch-target-comfortable mt-4"
        >
          {saving ? 'Saving...' : 'Save Integration Settings'}
        </button>
      </div>
    </div>
  );
}

