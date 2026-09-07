/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        nova: {
          50: '#f1f0ff',
          100: '#e4e1ff',
          200: '#cbc5ff',
          300: '#a99eff',
          400: '#8b7aff',
          500: '#7c5cff',
          600: '#6d3ff5',
          700: '#5c2fd6',
          800: '#4b27ad',
          900: '#3f2389',
        },
        accent: {
          400: '#38e0e0',
          500: '#22d3ee',
          600: '#0ea5c4',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#111827',
        },
        canvas: {
          DEFAULT: '#f6f7fb',
          dark: '#0b0f19',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124,92,255,0.15), 0 8px 24px -4px rgba(124,92,255,0.25)',
        card: '0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08)',
        'card-dark': '0 1px 2px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'gradient-nova': 'linear-gradient(135deg, #7c5cff 0%, #22d3ee 100%)',
        'gradient-nova-soft': 'linear-gradient(135deg, rgba(124,92,255,0.15) 0%, rgba(34,211,238,0.15) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
    },
  },
  plugins: [],
};
