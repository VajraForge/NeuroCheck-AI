/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neuro: {
          dark: '#F8FAFC',
          card: '#FFFFFF',
          glow: '#0284C7',
          accent: '#0D9488'
        },
        med: {
          slate: '#0F172A',
          blue: '#0284C7',
          indigo: '#4F46E5',
          teal: '#0D9488',
          emerald: '#059669',
          amber: '#D97706',
          rose: '#E11D48',
          surface: '#FFFFFF',
          bg: '#F8FAFC',
          border: '#E2E8F0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'med-card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'med-elevated': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        'med-glow': '0 0 20px -3px rgba(2, 132, 199, 0.25)'
      }
    },
  },
  plugins: [],
}
