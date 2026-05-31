import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Core ink/white system ──────────────────────────────
        ink:  { DEFAULT: '#0D0D0D', soft: '#1A1A1A', deep: '#000000' },
        white: '#FFFFFF',
        shell: '#E8E5DE',       // warm off-white desktop surround

        // ── Electric lime — the ONE accent ────────────────────
        lime: {
          DEFAULT: '#C8F135',
          dim:   '#AFDA1E',      // pressed / hover
          tint:  '#F2FBCC',      // subtle bg tint
          ghost: '#F7FDE6',      // card highlight wash
        },

        // ── Neutral surfaces ──────────────────────────────────
        cream:  '#FFFFFF',       // app surface (pure white)
        mist:   '#F7F5F1',       // secondary surface
        sand: { DEFAULT: '#F0EDE6', dark: '#E2DDD5' },

        // ── Text hierarchy ────────────────────────────────────
        tx: {
          DEFAULT: '#0D0D0D',
          mid:   '#5C5A56',
          light: '#9C9890',
          xlight:'#C4C1BA',
        },

        // ── Semantic / functional ─────────────────────────────
        // Kept for backwards compat — values updated to new palette
        navy:  { DEFAULT: '#0D0D0D', light: '#1A1A1A', dark: '#000000' },
        teal:  { DEFAULT: '#C8F135', light: '#F2FBCC', dark: '#AFDA1E' },
        terra: { DEFAULT: '#FF4F3B', light: '#FFF1EF', dark: '#D93828' },

        border: { DEFAULT: '#E8E5DE', light: '#F0EDE6' },
        deal:      '#FF4F3B',
        gold:      '#FFB800',
        whatsapp:  '#25D366',
        ember:     '#FF4F3B',
      },

      fontFamily: {
        display: ['Fraunces', 'serif'],
        body:    ['DM Sans', 'sans-serif'],
      },

      fontSize: {
        // editorial scale — tighter tracking at large sizes
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs:    ['12px', { lineHeight: '1.5' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['15px', { lineHeight: '1.6' }],
        md:    ['17px', { lineHeight: '1.5' }],
        lg:    ['20px', { lineHeight: '1.4' }],
        xl:    ['24px', { lineHeight: '1.3' }],
        '2xl': ['30px', { lineHeight: '1.2' }],
        '3xl': ['38px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '4xl': ['48px', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
        '5xl': ['60px', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
      },

      borderRadius: {
        DEFAULT: '12px',
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '22px',
        '2xl':'30px',
        '3xl':'40px',
        full: '9999px',
      },

      boxShadow: {
        // layered, cinematic
        card:     '0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        elevated: '0 4px 16px rgba(0,0,0,0.08), 0 16px 48px rgba(0,0,0,0.10)',
        pill:     '0 8px 32px rgba(0,0,0,0.20), 0 2px 8px rgba(0,0,0,0.12)',
        float:    '0 24px 64px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)',
        modal:    '0 -4px 40px rgba(0,0,0,0.14)',
        lime:     '0 8px 24px rgba(200,241,53,0.35)',
        inset:    'inset 0 1px 2px rgba(0,0,0,0.06)',
      },

      animation: {
        'fade-up':    'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'float-up':   'floatUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'shimmer':    'shimmer 1.6s linear infinite',
      },

      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        floatUp: {
          from: { opacity: '0', transform: 'translateY(32px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.25' },
          '50%':      { opacity: '0.55' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },

      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snappy: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
