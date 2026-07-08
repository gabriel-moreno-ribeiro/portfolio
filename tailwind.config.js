/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a0a',
          surface: '#141414',
          elevated: '#1a1a1a',
          overlay: 'rgba(10, 10, 10, 0.8)',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a0a0a0',
          tertiary: '#606060',
        },
        accent: {
          primary: '#00d9ff',
          muted: '#0099cc',
          subtle: '#003d66',
        },
      },
      fontSize: {
        'hero': ['3.5rem', { lineHeight: '1.2' }],
        'section': ['2rem', { lineHeight: '1.3' }],
        'subsection': ['1.5rem', { lineHeight: '1.4' }],
      },
      spacing: {
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      borderRadius: {
        tight: '0.25rem',
        normal: '0.5rem',
        lg: '0.75rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.9' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 32px rgba(0, 217, 255, 0.08)',
        'input-focus': '0 0 0 3px rgba(0, 217, 255, 0.1)',
      },
    },
  },
  plugins: [],
}
