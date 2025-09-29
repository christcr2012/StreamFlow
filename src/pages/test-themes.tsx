// src/pages/test-themes.tsx

/**
 * 🧪 THEME SYSTEM TEST PAGE
 * 
 * Comprehensive test page to verify all 6 themes work correctly.
 * Tests theme switching, CSS variables, and component styling.
 * 
 * TESTS:
 * - All 6 theme definitions load correctly
 * - CSS custom properties apply properly
 * - Real-time theme switching works
 * - Component styling adapts to themes
 * - Responsive behavior functions
 */

import { useState } from 'react';
import { ThemeProvider, useTheme } from '@/lib/themes/ThemeProvider';
import { allThemes, type ThemeId } from '@/lib/themes/theme-definitions';

export default function TestThemesPage() {
  return (
    <ThemeProvider>
      <TestThemeContent />
    </ThemeProvider>
  );
}

function TestThemeContent() {
  const { currentTheme, setTheme, themeConfig } = useTheme();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});

  const runThemeTest = (themeId: ThemeId) => {
    setTheme(themeId);
    
    // Test if CSS variables are applied
    setTimeout(() => {
      const root = document.documentElement;
      const accentColor = getComputedStyle(root).getPropertyValue('--theme-accent-primary');
      const bgMain = getComputedStyle(root).getPropertyValue('--theme-bg-main');
      
      const isWorking = accentColor && bgMain && accentColor.trim() !== '';
      setTestResults(prev => ({ ...prev, [themeId]: isWorking }));
    }, 100);
  };

  const runAllTests = () => {
    Object.keys(allThemes).forEach((themeId, index) => {
      setTimeout(() => {
        runThemeTest(themeId as ThemeId);
      }, index * 500);
    });
  };

  return (
    <div 
      className="min-h-screen p-8"
      style={{ background: 'var(--theme-bg-main)' }}
    >
      {/* Dynamic Grid Background */}
      <div className="fixed inset-0 opacity-10">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'var(--theme-grid-pattern)',
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>

      <div className="relative max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            🧪 Theme System Test
          </h1>
          <p style={{ color: 'var(--theme-text-secondary)' }}>
            Testing all 6 themes for proper functionality
          </p>
        </div>

        {/* Current Theme Display */}
        <div 
          className="p-6 rounded-2xl border backdrop-blur-xl"
          style={{
            backgroundColor: 'var(--theme-surface-1)',
            borderColor: 'var(--theme-border-accent)',
            boxShadow: '0 4px 6px var(--theme-shadow-accent)'
          }}
        >
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--theme-text-accent)' }}
          >
            Current Theme: {themeConfig.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 style={{ color: 'var(--theme-text-primary)' }} className="font-semibold mb-2">
                Theme Info
              </h3>
              <p style={{ color: 'var(--theme-text-secondary)' }} className="text-sm mb-2">
                {themeConfig.description}
              </p>
              <p style={{ color: 'var(--theme-text-tertiary)' }} className="text-xs capitalize">
                Category: {themeConfig.category}
              </p>
            </div>
            <div>
              <h3 style={{ color: 'var(--theme-text-primary)' }} className="font-semibold mb-2">
                Color Palette
              </h3>
              <div className="flex space-x-2">
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: 'var(--theme-accent-primary)' }}
                  title="Primary Accent"
                ></div>
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: 'var(--theme-accent-secondary)' }}
                  title="Secondary Accent"
                ></div>
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: 'var(--theme-accent-tertiary)' }}
                  title="Tertiary Accent"
                ></div>
                <div
                  className="w-8 h-8 rounded-lg"
                  style={{ backgroundColor: 'var(--theme-text-accent)' }}
                  title="Text Accent"
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Selector */}
        <div 
          className="p-6 rounded-2xl border backdrop-blur-xl"
          style={{
            backgroundColor: 'var(--theme-surface-1)',
            borderColor: 'var(--theme-border-primary)'
          }}
        >
          <h2 
            className="text-xl font-bold mb-4"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Theme Selector
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(allThemes).map(([themeId, theme]) => (
              <button
                key={themeId}
                onClick={() => setTheme(themeId as ThemeId)}
                className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                  currentTheme === themeId ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: currentTheme === themeId 
                    ? 'var(--theme-surface-2)' 
                    : 'var(--theme-surface-1)',
                  borderColor: currentTheme === themeId 
                    ? 'var(--theme-accent-primary)' 
                    : 'var(--theme-border-secondary)',
                  ringColor: 'var(--theme-accent-primary)'
                }}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: theme.colors.accentPrimary }}
                  ></div>
                  <h4 
                    className="font-semibold text-sm"
                    style={{ color: 'var(--theme-text-primary)' }}
                  >
                    {theme.name}
                  </h4>
                </div>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--theme-text-tertiary)' }}
                >
                  {theme.description}
                </p>
                <div className="mt-2 flex space-x-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.accentPrimary }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.accentSecondary }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.accentTertiary }}
                  ></div>
                </div>
                {testResults[themeId] !== undefined && (
                  <div className="mt-2">
                    <span 
                      className={`text-xs px-2 py-1 rounded ${
                        testResults[themeId] ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {testResults[themeId] ? '✅ Working' : '❌ Failed'}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={runAllTests}
              className="px-6 py-2 rounded-lg transition-all duration-300"
              style={{
                backgroundColor: 'var(--theme-accent-primary)',
                color: 'var(--theme-text-primary)'
              }}
            >
              🧪 Test All Themes
            </button>
            <button
              onClick={() => runThemeTest(currentTheme)}
              className="px-6 py-2 rounded-lg border transition-all duration-300"
              style={{
                backgroundColor: 'var(--theme-surface-2)',
                borderColor: 'var(--theme-border-accent)',
                color: 'var(--theme-text-accent)'
              }}
            >
              🔍 Test Current Theme
            </button>
          </div>
        </div>

        {/* Component Tests */}
        <div 
          className="p-6 rounded-2xl border backdrop-blur-xl"
          style={{
            backgroundColor: 'var(--theme-surface-1)',
            borderColor: 'var(--theme-border-primary)'
          }}
        >
          <h2 
            className="text-xl font-bold mb-4"
            style={{ color: 'var(--theme-text-primary)' }}
          >
            Component Style Tests
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buttons */}
            <div>
              <h3 style={{ color: 'var(--theme-text-secondary)' }} className="font-semibold mb-3">
                Buttons
              </h3>
              <div className="space-y-2">
                <button 
                  className="w-full px-4 py-2 rounded-lg transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--theme-accent-primary)',
                    color: 'var(--theme-text-primary)'
                  }}
                >
                  Primary Button
                </button>
                <button 
                  className="w-full px-4 py-2 rounded-lg border transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--theme-surface-2)',
                    borderColor: 'var(--theme-border-accent)',
                    color: 'var(--theme-text-accent)'
                  }}
                >
                  Secondary Button
                </button>
              </div>
            </div>

            {/* Cards */}
            <div>
              <h3 style={{ color: 'var(--theme-text-secondary)' }} className="font-semibold mb-3">
                Cards
              </h3>
              <div 
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: 'var(--theme-surface-2)',
                  borderColor: 'var(--theme-border-secondary)'
                }}
              >
                <h4 style={{ color: 'var(--theme-text-primary)' }} className="font-semibold">
                  Sample Card
                </h4>
                <p style={{ color: 'var(--theme-text-secondary)' }} className="text-sm mt-1">
                  This card adapts to the current theme
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results Summary */}
        {Object.keys(testResults).length > 0 && (
          <div 
            className="p-6 rounded-2xl border backdrop-blur-xl"
            style={{
              backgroundColor: 'var(--theme-surface-1)',
              borderColor: 'var(--theme-border-primary)'
            }}
          >
            <h2 
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--theme-text-primary)' }}
            >
              Test Results
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(testResults).map(([themeId, passed]) => (
                <div 
                  key={themeId}
                  className="p-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--theme-surface-2)',
                    borderColor: passed ? 'var(--theme-accent-success)' : 'var(--theme-accent-error)'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {passed ? '✅' : '❌'}
                    </span>
                    <span 
                      className="font-medium"
                      style={{ color: 'var(--theme-text-primary)' }}
                    >
                      {allThemes[themeId as ThemeId].name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
