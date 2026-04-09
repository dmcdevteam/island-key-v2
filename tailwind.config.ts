import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B2D4F', light: '#2A4066', dark: '#13203A' },
        teal: { DEFAULT: '#1A8A7D', light: '#E8F5F3', dark: '#14695F' },
        terra: { DEFAULT: '#D4854A', light: '#FDF3EB', dark: '#B86E3A' },
        sand: { DEFAULT: '#F7F3EE', dark: '#EDE6DC' },
        cream: '#FDFCFA',
        border: { DEFAULT: '#E8E2DA', light: '#F0EBE4' },
        tx: { DEFAULT: '#1E1E1E', mid: '#5A5A5A', light: '#8E8E8E' },
        deal: '#D94F4F',
        whatsapp: '#25D366',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        sm: '8px',
        lg: '16px',
        full: '9999px',
      },
      boxShadow: {
        card: '0 2px 12px rgba(27,45,79,0.06)',
        elevated: '0 8px 32px rgba(27,45,79,0.10)',
        modal: '0 -4px 40px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
