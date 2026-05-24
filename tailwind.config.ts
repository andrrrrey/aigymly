import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#F7F8FA',
          100: '#EFF1F5',
          200: '#E2E5EC',
          300: '#C7CCD6',
          400: '#9099A8',
          500: '#5C6677',
          600: '#3B4452',
          700: '#262C36',
          800: '#161A21',
          900: '#0B0D12',
        },
        brand: {
          DEFAULT: '#2F6BFF',
          dark: '#1E4FD6',
          light: '#5C8AFF',
        },
        marker: {
          red: '#FF4D5E',
          orange: '#FF9028',
          yellow: '#FFC23C',
          green: '#22C58B',
          cyan: '#22B8D9',
          blue: '#2F6BFF',
          purple: '#8B5CF6',
          gray: '#9099A8',
        },
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,13,18,0.04), 0 0 0 1px rgba(11,13,18,0.04)',
        elevated: '0 8px 24px -8px rgba(11,13,18,0.12), 0 0 0 1px rgba(11,13,18,0.04)',
        fab: '0 8px 24px -4px rgba(47,107,255,0.45), 0 2px 6px rgba(47,107,255,0.3)',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'press': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.96)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'press': 'press 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
