'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ThemeSettings {
  variant: 'premium-dark' | 'premium-light';
  primaryColor: string;
  accentColor: string;
}

export default function ProviderThemeSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ThemeSettings>({
    variant: 'premium-dark',
    primaryColor: '#00ff88',
    accentColor: '#3aa8ff',
  });

  // Load current theme settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch('/api/provider/theme');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.themeSettings) {
            setSettings(data.data.themeSettings);
          }
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/provider/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Theme settings saved successfully');
        // Reload page to apply new theme
        router.refresh();
      } else {
        alert(data.error || 'Failed to save theme settings');
      }
    } catch (error) {
      console.error('Error saving theme settings:', error);
      alert('Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-responsive spacing-responsive-md">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-responsive spacing-responsive-md">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Theme Customization
        </h1>
        <p className="text-responsive-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          Customize the provider portal UI theme with custom colors
        </p>
      </div>

      <div className="premium-card spacing-responsive-sm">
        <div className="space-y-6">
          {/* Theme Variant */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Theme Variant
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setSettings({ ...settings, variant: 'premium-dark' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  settings.variant === 'premium-dark'
                    ? 'border-[var(--brand-primary)] bg-[var(--surface-hover)]'
                    : 'border-[var(--border-primary)] hover:border-[var(--border-accent)]'
                }`}
              >
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Dark</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Premium dark theme</div>
              </button>
              <button
                onClick={() => setSettings({ ...settings, variant: 'premium-light' })}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                  settings.variant === 'premium-light'
                    ? 'border-[var(--brand-primary)] bg-[var(--surface-hover)]'
                    : 'border-[var(--border-primary)] hover:border-[var(--border-accent)]'
                }`}
              >
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Light</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Premium light theme</div>
              </button>
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Primary Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="h-12 w-20 rounded-lg border-2 cursor-pointer"
                style={{ borderColor: 'var(--border-primary)' }}
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                placeholder="#00ff88"
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-primary)',
                  background: 'var(--surface-1)',
                  color: 'var(--text-primary)',
                }}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Used for primary buttons, links, and accents
            </p>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Accent Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="h-12 w-20 rounded-lg border-2 cursor-pointer"
                style={{ borderColor: 'var(--border-primary)' }}
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                placeholder="#3aa8ff"
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-primary)',
                  background: 'var(--surface-1)',
                  color: 'var(--text-primary)',
                }}
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Used for secondary elements and gradients
            </p>
          </div>

          {/* Live Preview */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Live Preview
            </label>
            <div className="p-6 rounded-lg border-2 space-y-4" style={{ borderColor: 'var(--border-primary)' }}>
              <div
                className="px-4 py-2 rounded-lg text-white font-medium text-center"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Primary Button
              </div>
              <div
                className="px-4 py-2 rounded-lg text-white font-medium text-center"
                style={{ backgroundColor: settings.accentColor }}
              >
                Accent Button
              </div>
              <div
                className="px-4 py-2 rounded-lg text-white font-medium text-center"
                style={{
                  background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.accentColor} 100%)`,
                }}
              >
                Gradient Button
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'var(--brand-gradient)',
                minHeight: '44px',
              }}
            >
              {saving ? 'Saving...' : 'Save Theme Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 p-4 rounded-lg border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border-accent)' }}>
        <div className="flex gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--brand-primary)' }}>
              Provider Portal Theme
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              These theme settings apply to the provider portal. Changes take effect immediately after saving.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

