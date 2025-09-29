// src/lib/themes/theme-definitions.ts

/**
 * 🎨 ENTERPRISE THEME SYSTEM
 * 
 * Comprehensive theme definitions for the StreamFlow platform.
 * Supports 6 cutting-edge themes with full customization capabilities.
 * 
 * FEATURES:
 * - Real-time theme switching
 * - Provider-level theme management
 * - Owner-only client customization
 * - Brand asset integration
 * - Responsive theme adaptation
 */

export interface ThemeColors {
  // Primary Backgrounds
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  
  // Gradient Backgrounds
  bgMain: string;
  
  // Glass Morphism
  glassBg: string;
  glassBgLight: string;
  glassBorder: string;
  glassBorderAccent: string;
  
  // Surface Colors
  surface1: string;
  surface2: string;
  surface3: string;
  surfaceHover: string;
  
  // Typography
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textAccent: string;
  
  // Accent Colors
  accentPrimary: string;
  accentSecondary: string;
  accentTertiary: string;
  accentSuccess: string;
  accentWarning: string;
  accentError: string;
  accentInfo: string;
  
  // Border Colors
  borderPrimary: string;
  borderSecondary: string;
  borderAccent: string;
  
  // Shadow Colors
  shadowPrimary: string;
  shadowSecondary: string;
  shadowAccent: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  category: 'futuristic' | 'professional' | 'luxury' | 'tactical' | 'cosmic' | 'premium';
  colors: ThemeColors;
  patterns: {
    gridPattern?: string;
    backgroundPattern?: string;
    accentPattern?: string;
    dotPattern?: string;
    hexPattern?: string;
  };
  animations: {
    pulseColor: string;
    glowColor: string;
    hoverTransition: string;
  };
  typography: {
    fontFamily: string;
    headingGradient: string;
    accentFont: string;
  };
}

// 🚀 THEME 1: FUTURISTIC GREEN (Current)
export const futuristicGreenTheme: ThemeConfig = {
  id: 'futuristic-green',
  name: 'Futuristic Green',
  description: 'High-tech, masculine aesthetic with green accents and cutting-edge styling',
  category: 'futuristic',
  colors: {
    bgPrimary: '#0a0c10',
    bgSecondary: '#0f1318',
    bgTertiary: '#141920',
    bgElevated: '#1a1f28',
    bgMain: `
      radial-gradient(ellipse 1400px 900px at 50% -20%, rgba(34,197,94,0.08), transparent 60%),
      radial-gradient(ellipse 1200px 800px at 20% 100%, rgba(34,197,94,0.06), transparent 50%),
      linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)
    `,
    glassBg: 'rgba(20, 25, 35, 0.8)',
    glassBgLight: 'rgba(30, 35, 45, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassBorderAccent: 'rgba(34, 197, 94, 0.3)',
    surface1: 'rgba(20, 25, 35, 0.9)',
    surface2: 'rgba(26, 31, 40, 0.95)',
    surface3: 'rgba(32, 37, 48, 0.98)',
    surfaceHover: 'rgba(40, 45, 56, 0.8)',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    textMuted: '#64748b',
    textAccent: '#22c55e',
    accentPrimary: '#22c55e',
    accentSecondary: '#16a34a',
    accentTertiary: '#15803d',
    accentSuccess: '#10b981',
    accentWarning: '#f59e0b',
    accentError: '#ef4444',
    accentInfo: '#3b82f6',
    borderPrimary: 'rgba(34, 197, 94, 0.2)',
    borderSecondary: 'rgba(255, 255, 255, 0.1)',
    borderAccent: 'rgba(34, 197, 94, 0.3)',
    shadowPrimary: 'rgba(0, 0, 0, 0.5)',
    shadowSecondary: 'rgba(34, 197, 94, 0.05)',
    shadowAccent: 'rgba(34, 197, 94, 0.1)'
  },
  patterns: {
    gridPattern: `
      linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)
    `,
    backgroundPattern: `
      radial-gradient(circle at 25% 25%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)
    `
  },
  animations: {
    pulseColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.5)',
    hoverTransition: 'all 0.3s ease'
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    headingGradient: 'linear-gradient(to right, #ffffff, #dcfce7)',
    accentFont: "'JetBrains Mono', 'Fira Code', monospace"
  }
};

// 🔥 THEME 2: CRIMSON COMMAND
export const crimsonCommandTheme: ThemeConfig = {
  id: 'crimson-command',
  name: 'Crimson Command',
  description: 'Military-grade red/black theme with tactical aesthetics and sharp angular designs',
  category: 'tactical',
  colors: {
    bgPrimary: '#0c0a0a',
    bgSecondary: '#1a0f0f',
    bgTertiary: '#2a1515',
    bgElevated: '#3a1f1f',
    bgMain: `
      radial-gradient(ellipse 1400px 900px at 50% -20%, rgba(220,38,38,0.08), transparent 60%),
      radial-gradient(ellipse 1200px 800px at 20% 100%, rgba(185,28,28,0.06), transparent 50%),
      linear-gradient(180deg, #1c1917 0%, #292524 50%, #44403c 100%)
    `,
    glassBg: 'rgba(35, 20, 20, 0.8)',
    glassBgLight: 'rgba(45, 30, 30, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassBorderAccent: 'rgba(220, 38, 38, 0.3)',
    surface1: 'rgba(35, 20, 20, 0.9)',
    surface2: 'rgba(40, 26, 26, 0.95)',
    surface3: 'rgba(48, 32, 32, 0.98)',
    surfaceHover: 'rgba(56, 40, 40, 0.8)',
    textPrimary: '#fef2f2',
    textSecondary: '#fecaca',
    textTertiary: '#fca5a5',
    textMuted: '#f87171',
    textAccent: '#dc2626',
    accentPrimary: '#dc2626',
    accentSecondary: '#b91c1c',
    accentTertiary: '#991b1b',
    accentSuccess: '#16a34a',
    accentWarning: '#f59e0b',
    accentError: '#ef4444',
    accentInfo: '#3b82f6',
    borderPrimary: 'rgba(220, 38, 38, 0.2)',
    borderSecondary: 'rgba(255, 255, 255, 0.1)',
    borderAccent: 'rgba(220, 38, 38, 0.3)',
    shadowPrimary: 'rgba(0, 0, 0, 0.5)',
    shadowSecondary: 'rgba(220, 38, 38, 0.05)',
    shadowAccent: 'rgba(220, 38, 38, 0.1)'
  },
  patterns: {
    gridPattern: `
      linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)
    `,
    backgroundPattern: `
      radial-gradient(circle at 25% 25%, rgba(220, 38, 38, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(220, 38, 38, 0.1) 0%, transparent 50%)
    `
  },
  animations: {
    pulseColor: '#dc2626',
    glowColor: 'rgba(220, 38, 38, 0.5)',
    hoverTransition: 'all 0.3s ease'
  },
  typography: {
    fontFamily: "'Rajdhani', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    headingGradient: 'linear-gradient(to right, #ffffff, #fecaca)',
    accentFont: "'Share Tech Mono', 'JetBrains Mono', monospace"
  }
};

// 💎 THEME 3: PLATINUM ELITE
export const platinumEliteTheme: ThemeConfig = {
  id: 'platinum-elite',
  name: 'Platinum Elite',
  description: 'Luxury silver/white theme with premium glass effects and executive styling',
  category: 'luxury',
  colors: {
    bgPrimary: '#f8fafc',
    bgSecondary: '#f1f5f9',
    bgTertiary: '#e2e8f0',
    bgElevated: '#cbd5e1',
    bgMain: `
      radial-gradient(ellipse 1400px 900px at 50% -20%, rgba(148,163,184,0.08), transparent 60%),
      radial-gradient(ellipse 1200px 800px at 20% 100%, rgba(100,116,139,0.06), transparent 50%),
      linear-gradient(180deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)
    `,
    glassBg: 'rgba(248, 250, 252, 0.8)',
    glassBgLight: 'rgba(241, 245, 249, 0.6)',
    glassBorder: 'rgba(0, 0, 0, 0.1)',
    glassBorderAccent: 'rgba(148, 163, 184, 0.3)',
    surface1: 'rgba(248, 250, 252, 0.9)',
    surface2: 'rgba(241, 245, 249, 0.95)',
    surface3: 'rgba(226, 232, 240, 0.98)',
    surfaceHover: 'rgba(203, 213, 225, 0.8)',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textTertiary: '#64748b',
    textMuted: '#94a3b8',
    textAccent: '#475569',
    accentPrimary: '#64748b',
    accentSecondary: '#475569',
    accentTertiary: '#334155',
    accentSuccess: '#16a34a',
    accentWarning: '#f59e0b',
    accentError: '#ef4444',
    accentInfo: '#3b82f6',
    borderPrimary: 'rgba(148, 163, 184, 0.2)',
    borderSecondary: 'rgba(0, 0, 0, 0.1)',
    borderAccent: 'rgba(148, 163, 184, 0.3)',
    shadowPrimary: 'rgba(0, 0, 0, 0.1)',
    shadowSecondary: 'rgba(148, 163, 184, 0.1)',
    shadowAccent: 'rgba(148, 163, 184, 0.2)'
  },
  patterns: {
    gridPattern: `
      linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
    `,
    backgroundPattern: `
      radial-gradient(circle at 25% 25%, rgba(148, 163, 184, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(148, 163, 184, 0.1) 0%, transparent 50%)
    `
  },
  animations: {
    pulseColor: '#64748b',
    glowColor: 'rgba(148, 163, 184, 0.5)',
    hoverTransition: 'all 0.3s ease'
  },
  typography: {
    fontFamily: "'Playfair Display', 'Inter', serif",
    headingGradient: 'linear-gradient(to right, #0f172a, #64748b)',
    accentFont: "'Source Code Pro', 'JetBrains Mono', monospace"
  }
};

// 🌊 THEME 4: OCEAN DEEP
export const oceanDeepTheme: ThemeConfig = {
  id: 'ocean-deep',
  name: 'Ocean Deep',
  description: 'Professional blue gradient theme with wave patterns and corporate aesthetics',
  category: 'professional',
  colors: {
    bgPrimary: '#0c1220',
    bgSecondary: '#0f1629',
    bgTertiary: '#1e293b',
    bgElevated: '#334155',
    bgMain: `
      radial-gradient(ellipse 1400px 900px at 50% -20%, rgba(59,130,246,0.08), transparent 60%),
      radial-gradient(ellipse 1200px 800px at 20% 100%, rgba(37,99,235,0.06), transparent 50%),
      linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)
    `,
    glassBg: 'rgba(30, 41, 59, 0.8)',
    glassBgLight: 'rgba(51, 65, 85, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassBorderAccent: 'rgba(59, 130, 246, 0.3)',
    surface1: 'rgba(30, 41, 59, 0.9)',
    surface2: 'rgba(51, 65, 85, 0.95)',
    surface3: 'rgba(71, 85, 105, 0.98)',
    surfaceHover: 'rgba(100, 116, 139, 0.8)',
    textPrimary: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    textMuted: '#64748b',
    textAccent: '#3b82f6',
    accentPrimary: '#3b82f6',
    accentSecondary: '#2563eb',
    accentTertiary: '#1d4ed8',
    accentSuccess: '#16a34a',
    accentWarning: '#f59e0b',
    accentError: '#ef4444',
    accentInfo: '#06b6d4',
    borderPrimary: 'rgba(59, 130, 246, 0.2)',
    borderSecondary: 'rgba(255, 255, 255, 0.1)',
    borderAccent: 'rgba(59, 130, 246, 0.3)',
    shadowPrimary: 'rgba(0, 0, 0, 0.5)',
    shadowSecondary: 'rgba(59, 130, 246, 0.05)',
    shadowAccent: 'rgba(59, 130, 246, 0.1)'
  },
  patterns: {
    gridPattern: `
      linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
    `,
    backgroundPattern: `
      radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
    `
  },
  animations: {
    pulseColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.5)',
    hoverTransition: 'all 0.3s ease'
  },
  typography: {
    fontFamily: "'IBM Plex Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    headingGradient: 'linear-gradient(to right, #ffffff, #dbeafe)',
    accentFont: "'IBM Plex Mono', 'JetBrains Mono', monospace"
  }
};

// 🌅 THEME 5: SUNSET PRO
export const sunsetProTheme: ThemeConfig = {
  id: 'sunset-pro',
  name: 'Sunset Pro',
  description: 'Warm orange/gold theme with executive styling and premium gradients',
  category: 'professional',
  colors: {
    bgPrimary: '#1c1917',
    bgSecondary: '#292524',
    bgTertiary: '#44403c',
    bgElevated: '#57534e',
    bgMain: `
      radial-gradient(ellipse 1400px 900px at 50% -20%, rgba(251,146,60,0.08), transparent 60%),
      radial-gradient(ellipse 1200px 800px at 20% 100%, rgba(245,158,11,0.06), transparent 50%),
      linear-gradient(180deg, #1c1917 0%, #292524 50%, #44403c 100%)
    `,
    glassBg: 'rgba(68, 64, 60, 0.8)',
    glassBgLight: 'rgba(87, 83, 78, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassBorderAccent: 'rgba(251, 146, 60, 0.3)',
    surface1: 'rgba(68, 64, 60, 0.9)',
    surface2: 'rgba(87, 83, 78, 0.95)',
    surface3: 'rgba(120, 113, 108, 0.98)',
    surfaceHover: 'rgba(168, 162, 158, 0.8)',
    textPrimary: '#fef7ed',
    textSecondary: '#fed7aa',
    textTertiary: '#fdba74',
    textMuted: '#fb923c',
    textAccent: '#f97316',
    accentPrimary: '#f97316',
    accentSecondary: '#ea580c',
    accentTertiary: '#c2410c',
    accentSuccess: '#16a34a',
    accentWarning: '#f59e0b',
    accentError: '#ef4444',
    accentInfo: '#3b82f6',
    borderPrimary: 'rgba(251, 146, 60, 0.2)',
    borderSecondary: 'rgba(255, 255, 255, 0.1)',
    borderAccent: 'rgba(251, 146, 60, 0.3)',
    shadowPrimary: 'rgba(0, 0, 0, 0.5)',
    shadowSecondary: 'rgba(251, 146, 60, 0.05)',
    shadowAccent: 'rgba(251, 146, 60, 0.1)'
  },
  patterns: {
    gridPattern: `
      linear-gradient(rgba(251, 146, 60, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(251, 146, 60, 0.1) 1px, transparent 1px)
    `,
    backgroundPattern: `
      radial-gradient(circle at 25% 25%, rgba(251, 146, 60, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)
    `
  },
  animations: {
    pulseColor: '#f97316',
    glowColor: 'rgba(251, 146, 60, 0.5)',
    hoverTransition: 'all 0.3s ease'
  },
  typography: {
    fontFamily: "'Merriweather', 'Inter', serif",
    headingGradient: 'linear-gradient(to right, #ffffff, #fed7aa)',
    accentFont: "'Inconsolata', 'JetBrains Mono', monospace"
  }
};

// 🌌 THEME 6: COSMIC PURPLE
export const cosmicPurpleTheme: ThemeConfig = {
  id: 'cosmic-purple',
  name: 'Cosmic Purple',
  description: 'Space-age purple theme with nebula effects and futuristic styling',
  category: 'cosmic',
  colors: {
    bgPrimary: '#1e1b4b',
    bgSecondary: '#312e81',
    bgTertiary: '#4338ca',
    bgElevated: '#5b21b6',
    bgMain: `
      radial-gradient(ellipse 1400px 900px at 50% -20%, rgba(139,92,246,0.08), transparent 60%),
      radial-gradient(ellipse 1200px 800px at 20% 100%, rgba(124,58,237,0.06), transparent 50%),
      linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)
    `,
    glassBg: 'rgba(67, 56, 202, 0.8)',
    glassBgLight: 'rgba(91, 33, 182, 0.6)',
    glassBorder: 'rgba(255, 255, 255, 0.1)',
    glassBorderAccent: 'rgba(139, 92, 246, 0.3)',
    surface1: 'rgba(67, 56, 202, 0.9)',
    surface2: 'rgba(91, 33, 182, 0.95)',
    surface3: 'rgba(124, 58, 237, 0.98)',
    surfaceHover: 'rgba(139, 92, 246, 0.8)',
    textPrimary: '#f5f3ff',
    textSecondary: '#ddd6fe',
    textTertiary: '#c4b5fd',
    textMuted: '#a78bfa',
    textAccent: '#8b5cf6',
    accentPrimary: '#8b5cf6',
    accentSecondary: '#7c3aed',
    accentTertiary: '#6d28d9',
    accentSuccess: '#16a34a',
    accentWarning: '#f59e0b',
    accentError: '#ef4444',
    accentInfo: '#3b82f6',
    borderPrimary: 'rgba(139, 92, 246, 0.2)',
    borderSecondary: 'rgba(255, 255, 255, 0.1)',
    borderAccent: 'rgba(139, 92, 246, 0.3)',
    shadowPrimary: 'rgba(0, 0, 0, 0.5)',
    shadowSecondary: 'rgba(139, 92, 246, 0.05)',
    shadowAccent: 'rgba(139, 92, 246, 0.1)'
  },
  patterns: {
    gridPattern: `
      linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
    `,
    backgroundPattern: `
      radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
    `
  },
  animations: {
    pulseColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.5)',
    hoverTransition: 'all 0.3s ease'
  },
  typography: {
    fontFamily: "'Orbitron', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    headingGradient: 'linear-gradient(to right, #ffffff, #ddd6fe)',
    accentFont: "'Space Mono', 'JetBrains Mono', monospace"
  }
};

// Robinson Solutions Premium Theme
const robinsonPremiumTheme: ThemeConfig = {
  id: 'robinson-premium',
  name: 'Robinson Premium',
  description: 'Ultra-premium metallic blue design for Robinson Solutions enterprise platform',
  category: 'premium',
  colors: {
    // Background Colors
    bgPrimary: '#0a0e14',
    bgSecondary: '#0f1419',
    bgTertiary: '#141a21',
    bgElevated: '#1a2029',
    bgMain: `
      radial-gradient(ellipse 1400px 900px at 50% -20%, rgba(74,144,226,0.08), transparent 60%),
      radial-gradient(ellipse 1200px 800px at 20% 100%, rgba(74,144,226,0.06), transparent 50%),
      linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #334155 100%)
    `,

    // Glass Effects
    glassBg: 'rgba(74, 144, 226, 0.05)',
    glassBgLight: 'rgba(74, 144, 226, 0.08)',
    glassBorder: 'rgba(74, 144, 226, 0.15)',
    glassBorderAccent: 'rgba(74, 144, 226, 0.25)',

    // Surface Colors
    surface1: 'rgba(74, 144, 226, 0.03)',
    surface2: 'rgba(74, 144, 226, 0.06)',
    surface3: 'rgba(74, 144, 226, 0.09)',
    surfaceHover: 'rgba(74, 144, 226, 0.12)',

    // Typography
    textPrimary: '#ffffff',
    textSecondary: '#e2e8f0',
    textTertiary: '#cbd5e1',
    textMuted: '#94a3b8',
    textAccent: '#4a90e2',

    // Medium metallic blue color scheme
    accentPrimary: '#4a90e2',      // Medium metallic blue
    accentSecondary: '#357abd',     // Deeper metallic blue
    accentTertiary: '#6ba3e8',     // Lighter metallic blue
    accentSuccess: '#28a745',      // Success green
    accentWarning: '#ffc107',      // Warning amber
    accentError: '#dc3545',        // Error red
    accentInfo: '#17a2b8',         // Info cyan

    // Border Colors
    borderPrimary: 'rgba(74, 144, 226, 0.2)',
    borderSecondary: 'rgba(74, 144, 226, 0.15)',
    borderAccent: 'rgba(74, 144, 226, 0.4)',

    // Shadow colors for depth
    shadowPrimary: 'rgba(74, 144, 226, 0.25)',
    shadowSecondary: 'rgba(74, 144, 226, 0.15)',
    shadowAccent: 'rgba(74, 144, 226, 0.35)'
  },
  patterns: {
    gridPattern: `
      linear-gradient(rgba(74, 144, 226, 0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(74, 144, 226, 0.1) 1px, transparent 1px)
    `,
    dotPattern: `
      radial-gradient(circle, rgba(74, 144, 226, 0.15) 1px, transparent 1px)
    `,
    hexPattern: `
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234a90e2' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
    `
  },
  animations: {
    pulseColor: '#4a90e2',
    glowColor: 'rgba(74, 144, 226, 0.5)',
    hoverTransition: 'all 0.3s ease'
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    headingGradient: 'linear-gradient(to right, #ffffff, #e2e8f0)',
    accentFont: "'JetBrains Mono', 'Fira Code', monospace"
  }
};

export const allThemes = {
  'futuristic-green': futuristicGreenTheme,
  'crimson-command': crimsonCommandTheme,
  'platinum-elite': platinumEliteTheme,
  'ocean-deep': oceanDeepTheme,
  'sunset-pro': sunsetProTheme,
  'cosmic-purple': cosmicPurpleTheme,
  'robinson-premium': robinsonPremiumTheme
};

export type ThemeId = keyof typeof allThemes;
