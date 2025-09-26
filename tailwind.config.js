/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    // Responsive container system  
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
        '3xl': '5rem',
        '4xl': '6rem',
        '5xl': '8rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        '4xl': '2560px',
        '5xl': '3440px',
      },
    },
    extend: {
      // Enhanced responsive breakpoints for complete coverage
      screens: {
        'xxs': '320px',  // Very small mobile devices
        'xs': '475px',   // Extra small devices
        'sm': '640px',   // Small devices (tablets)
        'md': '768px',   // Medium devices (small desktops)
        'lg': '1024px',  // Large devices (desktops)
        'xl': '1280px',  // Extra large devices
        '2xl': '1536px', // Ultra large devices
        '3xl': '1920px', // Ultra wide devices
        '4xl': '2560px', // 4K and ultra-wide monitors
        '5xl': '3440px', // Ultra-wide 21:9 monitors
      },
      // Responsive spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Responsive typography
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
}
