import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': 'http://127.0.0.1:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('react-router')) {
            return 'vendor-router'
          }

          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) {
            return 'vendor-react'
          }

          if (id.includes('zod')) {
            return 'vendor-zod'
          }

          return 'vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // RTL-тесты под параллельной нагрузкой могут превышать дефолтные 5 c
    testTimeout: 30000,
    // Редкие тайминговые флаки RTL под нагрузкой: один повтор без вреда для корректности
    retry: 1,
    setupFiles: './src/test/setup.ts',
    // Exclude agent-skills repo content from project test discovery
    exclude: [
      'node_modules',
      '**/node_modules/**',
      'dist',
      '.git',
      '.agents/skills/**',
      '.opencode/**',
      'e2e/**',
    ],
    env: {
      // Пусто → server/db использует PGlite (WASM-Postgres) вместо Neon
      DATABASE_URL: '',
      // Ускоряет старт: PGlite инициализируется в одном потоке
      NODE_ENV: 'test',
      // CAPTCHA выключена в тестах (ADR-0025). process.loadEnvFile не
      // перезаписывает уже заданные переменные, поэтому локальный .env с
      // боевыми ключами не может включить капчу в наборе тестов.
      TURNSTILE_SITEKEY: '',
      TURNSTILE_SECRET_KEY: '',
      // Email-уведомления выключены в тестах (ADR-0026): без ключа отправка —
      // no-op, сеть не задействуется. Значения заданы явно, чтобы локальный .env
      // с боевыми ключами не включил реальную отправку в наборе тестов.
      EMAIL_API_KEY: '',
      REMINDERS_SECRET: '',
      // Лимиты запросов подняты до несущественности: наборы тестов делают
      // десятки POST подряд с одного адреса и не должны упираться в счётчик.
      // Боевые значения — в server/rate-limit.ts (ADR-0025).
      RATE_LIMIT_BOOKING_MAX: '100000',
      RATE_LIMIT_READ_MAX: '100000',
      RATE_LIMIT_GLOBAL_MAX: '100000',
    },
  },
})
