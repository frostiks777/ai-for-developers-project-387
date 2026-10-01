import tailwindcssAnimate from 'tailwindcss-animate'
import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Golos Text"', ...defaultTheme.fontFamily.sans],
        serif: ['Lora', ...defaultTheme.fontFamily.serif],
      },
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          foreground: 'hsl(var(--surface-foreground) / <alpha-value>)',
        },
        selected: {
          DEFAULT: 'hsl(var(--selected) / <alpha-value>)',
          foreground: 'hsl(var(--selected-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'hsl(var(--success) / <alpha-value>)',
          soft: 'hsl(var(--success-soft) / <alpha-value>)',
        },
        'segment-active': 'hsl(var(--segment-active) / <alpha-value>)',
        'disabled-foreground': 'hsl(var(--disabled-foreground) / <alpha-value>)',
        'destructive-border': 'hsl(var(--destructive-border) / <alpha-value>)',
        highlight: {
          DEFAULT: 'hsl(var(--highlight) / <alpha-value>)',
          foreground: 'hsl(var(--highlight-foreground) / <alpha-value>)',
        },
        blob: {
          1: 'hsl(var(--blob-1) / <alpha-value>)',
          2: 'hsl(var(--blob-2) / <alpha-value>)',
          3: 'hsl(var(--blob-3) / <alpha-value>)',
          4: 'hsl(var(--blob-4) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '0.875rem',
        card: '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgb(28 25 23 / 0.04), 0 12px 32px rgb(28 25 23 / 0.06)',
        // Свечение выбранного времени и главной кнопки
        glow: '0 0 0 4px hsl(var(--highlight) / 0.35), 0 8px 20px hsl(var(--highlight) / 0.35)',
        'glow-lg': '0 10px 26px hsl(var(--highlight) / 0.42)',
        glass: '0 1px 2px rgb(28 25 23 / 0.04), 0 12px 32px rgb(28 25 23 / 0.06)',
      },
      keyframes: {
        'blob-a': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(18%, 12%) scale(1.12)' },
          '100%': { transform: 'translate(6%, 24%) scale(0.94)' },
        },
        'blob-b': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-16%, 18%) scale(0.9)' },
          '100%': { transform: 'translate(-24%, -6%) scale(1.1)' },
        },
        'blob-c': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(20%, -14%) scale(1.15)' },
          '100%': { transform: 'translate(-10%, -20%) scale(1)' },
        },
        'blob-d': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(-30%, -40%) scale(1.25)' },
        },
      },
      animation: {
        'blob-a': 'blob-a 19s ease-in-out infinite alternate',
        'blob-b': 'blob-b 23s ease-in-out infinite alternate',
        'blob-c': 'blob-c 27s ease-in-out infinite alternate',
        'blob-d': 'blob-d 21s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
