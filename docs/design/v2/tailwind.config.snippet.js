// Дизайн v2: изменения в tailwind.config.js.
//
// 1. ВСЕ цвета из hsl(var(--x)) перевести в hsl(var(--x) / <alpha-value>).
//    Без этого не работают модификаторы прозрачности (bg-card/70, ring-highlight/40),
//    а стекло и свечение на них построены. Пример для одного цвета:
//      background: 'hsl(var(--background) / <alpha-value>)',
//      primary: { DEFAULT: 'hsl(var(--primary) / <alpha-value>)', foreground: 'hsl(var(--primary-foreground) / <alpha-value>)' },
//    Так же для border, input, ring, foreground, secondary, destructive, muted, accent, popover,
//    card, surface, selected, success, segment-active, disabled-foreground, destructive-border.
//
// 2. Добавить в theme.extend ключи ниже (слить с существующими, не заменять целиком).

/** @type {import('tailwindcss').Config['theme']} */
export const extendV2 = {
  colors: {
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
  boxShadow: {
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
}
