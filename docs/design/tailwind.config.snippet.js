// Дополнения к tailwind.config.js для утверждённого дизайна.
// Существующие цвета shadcn (border, input, ring, background, primary, …) оставить как есть,
// добавить ключи ниже в theme.extend. Значения берутся из CSS-переменных docs/design/tokens.css.
import defaultTheme from 'tailwindcss/defaultTheme'

export const designExtend = {
  fontFamily: {
    sans: ['"Golos Text"', ...defaultTheme.fontFamily.sans],
    serif: ['Lora', ...defaultTheme.fontFamily.serif],
  },
  colors: {
    surface: {
      DEFAULT: 'hsl(var(--surface))',
      foreground: 'hsl(var(--surface-foreground))',
    },
    selected: {
      DEFAULT: 'hsl(var(--selected))',
      foreground: 'hsl(var(--selected-foreground))',
    },
    success: {
      DEFAULT: 'hsl(var(--success))',
      soft: 'hsl(var(--success-soft))',
    },
    'segment-active': 'hsl(var(--segment-active))',
    'disabled-foreground': 'hsl(var(--disabled-foreground))',
    'destructive-border': 'hsl(var(--destructive-border))',
  },
  borderRadius: {
    // lg / md / sm уже завязаны на --radius (теперь 10px)
    xl: '0.875rem', // 14px — элементы на телефоне
    card: '1.25rem', // 20px — карточки и диалоги
  },
  boxShadow: {
    soft: '0 1px 2px rgb(28 25 23 / 0.04), 0 12px 32px rgb(28 25 23 / 0.06)', // shadow-soft (не shadow-card: имя совпало бы с цветом card)
  },
}

// Пример подключения в tailwind.config.js:
//
// theme: {
//   extend: {
//     ...designExtend,
//     colors: { ...текущие цвета shadcn..., ...designExtend.colors },
//     borderRadius: { ...текущие lg/md/sm..., ...designExtend.borderRadius },
//   },
// },
