// src/pages/settings/themes.tsx

/**
 * 🎨 CLIENT THEME CUSTOMIZATION
 * 
 * Owner-only theme customization interface for client organizations.
 * Allows business owners to customize their organization's theme.
 * 
 * FEATURES:
 * - Real-time theme preview
 * - Owner-only access control
 * - Brand asset integration
 * - Custom color overrides
 * - Theme inheritance from provider
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMe } from '@/lib/useMe';
import AppShell from '@/components/AppShell';
import { ThemeProvider, ThemeSelector, useTheme } from '@/lib/themes/ThemeProvider';
import { allThemes, type ThemeId } from '@/lib/themes/theme-definitions';

export default function ClientThemesPage() {
  const router = useRouter();
  const { me, org, loading } = useMe();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    if (!loading) {
      // Check if user is OWNER
      const isOwner = me?.role === 'OWNER';
      setHasAccess(isOwner);
      setIsLoading(false);
      
      if (!isOwner) {
        router.push('/dashboard');
      }
    }
  }, [me, loading, router]);

  if (loading || isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!hasAccess) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">Only organization owners can customize themes.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <ThemeProvider orgId={org?.id}>
      <AppShell>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                Theme Customization
              </h1>
              <p className="text-slate-400 mt-2">
                Customize your organization's visual theme
              </p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl">
              <span className="text-green-400 text-sm font-mono font-bold">OWNER ACCESS</span>
            </div>
          </div>

          {/* Current Theme Display */}
          <CurrentThemeDisplay />

          {/* Theme Selector */}
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
            <ThemeSelector />
          </div>

          {/* Brand Customization */}
          <BrandCustomization />

          {/* Color Customization */}
          <ColorCustomization />
        </div>
      </AppShell>
    </ThemeProvider>
  );
}

function CurrentThemeDisplay() {
  const { currentTheme, themeConfig } = useTheme();

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Current Theme</h2>
      <div className="flex items-center space-x-6">
        <div
          className="w-16 h-16 rounded-xl"
          style={{ backgroundColor: themeConfig.colors.accentPrimary }}
        ></div>
        <div>
          <h3 className="text-2xl font-bold text-white">{themeConfig.name}</h3>
          <p className="text-slate-400">{themeConfig.description}</p>
          <div className="flex items-center space-x-2 mt-2">
            <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs capitalize">
              {themeConfig.category}
            </span>
            <div className="flex space-x-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: themeConfig.colors.accentPrimary }}
              ></div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: themeConfig.colors.accentSecondary }}
              ></div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: themeConfig.colors.accentTertiary }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandCustomization() {
  const { customization, updateCustomization } = useTheme();
  const [logoUrl, setLogoUrl] = useState(customization.brandAssets?.logoUrl || '');
  const [brandName, setBrandName] = useState(customization.brandAssets?.brandName || '');

  const handleSaveBrandAssets = () => {
    updateCustomization({
      brandAssets: {
        logoUrl,
        brandName
      }
    });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Brand Assets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Brand Name
          </label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
            placeholder="Your Business Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Logo URL
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 text-white rounded-lg focus:border-green-500 focus:outline-none"
            placeholder="https://example.com/logo.png"
          />
        </div>
      </div>
      <div className="mt-6">
        <button
          onClick={handleSaveBrandAssets}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
        >
          Save Brand Assets
        </button>
      </div>
    </div>
  );
}

function ColorCustomization() {
  const { themeConfig, customization, updateCustomization } = useTheme();
  const [customColors, setCustomColors] = useState(customization.customColors || {});

  const colorKeys = [
    { key: 'accentPrimary', label: 'Primary Accent' },
    { key: 'accentSecondary', label: 'Secondary Accent' },
    { key: 'accentTertiary', label: 'Tertiary Accent' },
    { key: 'textAccent', label: 'Text Accent' }
  ];

  const handleColorChange = (key: string, value: string) => {
    const newColors = { ...customColors, [key]: value };
    setCustomColors(newColors);
  };

  const handleSaveColors = () => {
    updateCustomization({
      customColors
    });
  };

  const handleResetColors = () => {
    setCustomColors({});
    updateCustomization({
      customColors: {}
    });
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-green-500/20 p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Color Customization</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {colorKeys.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {label}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={customColors[key] || themeConfig.colors[key as keyof typeof themeConfig.colors]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="w-12 h-10 rounded border border-slate-600 bg-slate-800"
              />
              <input
                type="text"
                value={customColors[key] || themeConfig.colors[key as keyof typeof themeConfig.colors]}
                onChange={(e) => handleColorChange(key, e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 text-white rounded text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex space-x-4">
        <button
          onClick={handleSaveColors}
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300"
        >
          Save Colors
        </button>
        <button
          onClick={handleResetColors}
          className="px-6 py-2 bg-slate-800 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-all duration-300"
        >
          Reset to Default
        </button>
      </div>
    </div>
  );
}
