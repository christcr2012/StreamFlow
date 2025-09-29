// src/lib/themes/ThemeProvider.tsx

/**
 * 🎨 THEME PROVIDER SYSTEM
 * 
 * React context provider for real-time theme switching and customization.
 * Supports all 6 themes with dynamic CSS variable injection.
 * 
 * FEATURES:
 * - Real-time theme switching
 * - CSS custom property injection
 * - Theme persistence
 * - Brand asset integration
 * - Responsive theme adaptation
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { allThemes, type ThemeId, type ThemeConfig } from './theme-definitions';

interface ThemeContextType {
  currentTheme: ThemeId;
  themeConfig: ThemeConfig;
  customization: any;
  setTheme: (themeId: ThemeId) => void;
  updateCustomization: (customization: any) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  orgId?: string;
  initialTheme?: ThemeId;
}

export function ThemeProvider({ children, orgId, initialTheme = 'futuristic-green' }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(initialTheme);
  const [customization, setCustomization] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load theme configuration on mount
  useEffect(() => {
    loadThemeConfiguration();
  }, [orgId]);

  // Apply theme CSS variables when theme changes
  useEffect(() => {
    applyThemeToDOM();
  }, [currentTheme, customization]);

  const loadThemeConfiguration = async () => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/themes?orgId=${orgId}`);
      const data = await response.json();

      if (data.ok) {
        setCurrentTheme(data.currentTheme || 'futuristic-green');
        setCustomization(data.customization || {});
      }
    } catch (error) {
      console.error('Failed to load theme configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (themeId: ThemeId) => {
    if (!orgId) {
      setCurrentTheme(themeId);
      return;
    }

    try {
      const response = await fetch('/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeId,
          orgId,
          isProvider: false // TODO: Detect provider context
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setCurrentTheme(themeId);
      }
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  };

  const updateCustomization = async (newCustomization: any) => {
    if (!orgId) {
      setCustomization(newCustomization);
      return;
    }

    try {
      const response = await fetch('/api/themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId,
          ...newCustomization
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setCustomization(data.customization);
      }
    } catch (error) {
      console.error('Failed to update theme customization:', error);
    }
  };

  const applyThemeToDOM = () => {
    const theme = allThemes[currentTheme];
    const root = document.documentElement;

    // Apply base theme colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Apply custom color overrides
    if (customization.customColors) {
      Object.entries(customization.customColors).forEach(([key, value]) => {
        const cssVar = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
        root.style.setProperty(cssVar, value as string);
      });
    }

    // Apply patterns
    if (theme.patterns.gridPattern) {
      root.style.setProperty('--theme-grid-pattern', theme.patterns.gridPattern);
    }
    if (theme.patterns.backgroundPattern) {
      root.style.setProperty('--theme-background-pattern', theme.patterns.backgroundPattern);
    }

    // Apply animations
    root.style.setProperty('--theme-pulse-color', theme.animations.pulseColor);
    root.style.setProperty('--theme-glow-color', theme.animations.glowColor);
    root.style.setProperty('--theme-hover-transition', theme.animations.hoverTransition);

    // Apply typography
    root.style.setProperty('--theme-font-family', theme.typography.fontFamily);
    root.style.setProperty('--theme-heading-gradient', theme.typography.headingGradient);
    root.style.setProperty('--theme-accent-font', theme.typography.accentFont);

    // Apply background main
    root.style.setProperty('--theme-bg-main', theme.colors.bgMain);

    // Add theme class to body for CSS targeting
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${currentTheme}`);
  };

  const themeConfig = allThemes[currentTheme];

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        themeConfig,
        customization,
        setTheme,
        updateCustomization,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme selector component for easy theme switching
export function ThemeSelector({ className = '' }: { className?: string }) {
  const { currentTheme, setTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Choose Theme</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Object.entries(allThemes).map(([themeId, theme]) => (
          <button
            key={themeId}
            onClick={() => setTheme(themeId as ThemeId)}
            className={`
              p-4 rounded-xl border-2 transition-all duration-300 text-left
              ${currentTheme === themeId
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            <div className="flex items-center space-x-3 mb-2">
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: theme.colors.accentPrimary }}
              ></div>
              <h4 className="font-semibold text-sm">{theme.name}</h4>
            </div>
            <p className="text-xs text-gray-600">{theme.description}</p>
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
          </button>
        ))}
      </div>
    </div>
  );
}
