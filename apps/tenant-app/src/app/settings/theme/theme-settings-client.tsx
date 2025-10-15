'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@cortiware/ui';
import { showToast } from '@/components/ui/toast';

interface ThemeSettings {
  variant: 'premium-dark' | 'premium-light';
  primaryColor: string;
  accentColor: string;
}

export default function ThemeSettingsClient() {
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
        const response = await fetch('/api/settings/theme');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.themeSettings) {
            setSettings(data.data.themeSettings);
          }
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
        showToast('Failed to load theme settings', 'error');
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('Theme settings saved successfully', 'success');
        // Reload page to apply new theme
        router.refresh();
      } else {
        showToast(data.error || 'Failed to save theme settings', 'error');
      }
    } catch (error) {
      console.error('Error saving theme settings:', error);
      showToast('Failed to save theme settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Theme Customization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm md:text-base">
            Customize your organization's UI theme with custom colors
          </p>
        </div>

        <Card>
          <CardHeader title="Theme Settings" />
          <div className="p-4 md:p-6 space-y-6">
            {/* Theme Variant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme Variant
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setSettings({ ...settings, variant: 'premium-dark' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    settings.variant === 'premium-dark'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Premium dark theme</div>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, variant: 'premium-light' })}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    settings.variant === 'premium-light'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Light</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Premium light theme</div>
                </button>
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  placeholder="#00ff88"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for primary buttons, links, and accents
              </p>
            </div>

            {/* Accent Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Accent Color
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  className="h-12 w-20 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  placeholder="#3aa8ff"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Used for secondary elements and gradients
              </p>
            </div>

            {/* Live Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Live Preview
              </label>
              <div className="p-6 rounded-lg border-2 border-gray-300 dark:border-gray-600 space-y-4">
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
            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{ minHeight: '44px' }}
              >
                {saving ? 'Saving...' : 'Save Theme Settings'}
              </button>
            </div>
          </div>
        </Card>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Organization-Wide Theme
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                These theme settings apply to your entire organization. All users will see the custom colors you configure here.
                Changes take effect immediately after saving.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

