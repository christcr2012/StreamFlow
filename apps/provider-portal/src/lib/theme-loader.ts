/**
 * Theme Loader for Provider-Portal
 * 
 * Loads provider-specific theme settings from database
 * and generates CSS variables for injection into HTML
 */

import { prisma } from '@/lib/prisma';

export interface ThemeSettings {
  variant: 'premium-dark' | 'premium-light';
  primaryColor: string;
  accentColor: string;
}

const DEFAULT_THEME: ThemeSettings = {
  variant: 'premium-dark',
  primaryColor: '#00ff88',
  accentColor: '#3aa8ff',
};

/**
 * Load theme settings for provider portal
 */
export async function loadProviderTheme(): Promise<ThemeSettings> {
  try {
    const config = await prisma.providerConfig.findFirst({
      select: {
        themeSettings: true,
      } as any, // Type assertion: themeSettings will exist after migration
    });

    if (!config || !(config as any).themeSettings) {
      return DEFAULT_THEME;
    }

    const settings = (config as any).themeSettings as ThemeSettings;
    
    // Validate theme settings
    if (!settings.variant || !settings.primaryColor || !settings.accentColor) {
      return DEFAULT_THEME;
    }

    return settings;
  } catch (error) {
    console.error('Error loading provider theme:', error);
    return DEFAULT_THEME;
  }
}

/**
 * Generate CSS variables from theme settings
 */
export function generateThemeCSS(theme: ThemeSettings): string {
  return `
    :root {
      --brand-primary: ${theme.primaryColor};
      --brand-secondary: ${theme.accentColor};
      --brand-gradient: linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.accentColor} 100%);
    }
  `.trim();
}

