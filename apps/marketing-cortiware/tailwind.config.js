/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/styles/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors (full spectrum)
        brand: {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          200: 'var(--brand-200)',
          300: 'var(--brand-300)',
          400: 'var(--brand-400)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
          800: 'var(--brand-800)',
          900: 'var(--brand-900)',
          950: 'var(--brand-950)',
          DEFAULT: 'var(--brand-primary)',
        },
        // Semantic colors
        primary: 'var(--brand-primary)',
        secondary: 'var(--brand-secondary)',
        accent: 'var(--brand-accent)',
        // UI colors
        bg: 'var(--bg)',
        'bg-elevated': 'var(--bg-elevated)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',
        'surface-2': 'var(--surface-2)',
        'glass-bg': 'var(--glass-bg)',
        'glass-bg-light': 'var(--glass-bg-light)',
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'border-accent': 'var(--border-accent)',
        // Text colors
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-subtle': 'var(--text-subtle)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-on-brand': 'var(--text-on-brand)',
        // Semantic accents
        success: 'var(--accent-success)',
        warning: 'var(--accent-warning)',
        error: 'var(--accent-error)',
        info: 'var(--accent-info)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      spacing: {
        xs: 'var(--spacing-xs)',
        sm: 'var(--spacing-sm)',
        md: 'var(--spacing-md)',
        lg: 'var(--spacing-lg)',
        xl: 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        '2xl': 'var(--shadow-2xl)',
        glow: 'var(--shadow-glow)',
        'glow-intense': 'var(--shadow-glow-intense)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        DEFAULT: 'var(--duration-normal)',
        normal: 'var(--duration-normal)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--ease-out)',
        'fade-in-up': 'fadeInUp var(--duration-normal) var(--ease-out)',
        'slide-in-right': 'slideInRight var(--duration-normal) var(--ease-out)',
        'pulse-glow': 'pulseGlow var(--duration-slow) var(--ease-in-out) infinite',
        'spin': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: 'var(--shadow-glow)' },
          '50%': { boxShadow: 'var(--shadow-glow-intense)' },
        },
      },
      backgroundImage: {
        'brand-gradient': 'var(--brand-gradient)',
      },
      zIndex: {
        base: 'var(--z-base)',
        dropdown: 'var(--z-dropdown)',
        sticky: 'var(--z-sticky)',
        fixed: 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        modal: 'var(--z-modal)',
        popover: 'var(--z-popover)',
        tooltip: 'var(--z-tooltip)',
      },
    },
  },
  plugins: [],
};

