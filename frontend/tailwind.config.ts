import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f5',
          100: '#fce5eb',
          200: '#f9cdd7',
          300: '#f4a5b9',
          400: '#ef7294',
          500: '#E84C7A',   // Main brand pink extracted from logo
          600: '#d72c63',
          700: '#ba1b4e',
          800: '#9b1845',
          900: '#84183f',
          950: '#4a0820',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#1194D7',   // Main brand blue extracted from logo
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        success: {
          500: '#43A047',   // Brand green (stock, success)
          600: '#388E3C',
        },
        warning: {
          500: '#FFA726',   // Brand amber (badges, offers)
          600: '#F57C00',
        },
        accent: {
          purple: '#AB47BC',
        },
        surface: {
          50: '#FAFAFA',
          100: '#FFF5F9',   // Soft blush background
          200: '#FFE8F5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(240, 40, 153, 0.07), 0 10px 20px -2px rgba(240, 40, 153, 0.04)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 20px rgba(240, 40, 153, 0.15), 0 8px 30px rgba(0,0,0,0.08)',
        'button': '0 4px 14px rgba(240, 40, 153, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 1.8s infinite linear',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
}

export default config
