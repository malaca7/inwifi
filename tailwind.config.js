/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#38bdf8',
          600: '#0284c7',
          700: '#0369a1',
          800: '#1f1f1f',
          900: '#121212',
          950: '#080808',
          electric: '#00D2FF',
          cyan: '#00D2FF',
          glow: '#38BDF8'
        },
        dark: {
          bg: '#000000',
          surface: '#080808',
          card: '#121212',
          cardHover: '#181818',
          border: '#222222',
          borderGlow: '#333333'
        },
        slate: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#333333',
          800: '#222222',
          850: '#171717',
          900: '#101010',
          950: '#050505'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(0, 210, 255, 0.25)',
        'glow-md': '0 0 25px -5px rgba(0, 210, 255, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(0, 210, 255, 0.35)',
        'card-dark': '0 8px 30px rgba(0, 0, 0, 0.85)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out forwards',
        'slide-right': 'slideRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      }
    },
  },
  plugins: [],
}
