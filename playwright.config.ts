import { defineConfig, devices } from '@playwright/test'

// E2E гоняется против собранного приложения: Fastify отдаёт dist/ и /api на одном origin.
// Без DATABASE_URL поднимается PGlite (in-memory), поэтому каждый прогон — с чистого состояния.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3210',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm start',
    url: 'http://127.0.0.1:3210/health',
    env: {
      PORT: '3210',
      DATABASE_URL: '',
      NODE_ENV: 'test',
      // CAPTCHA выключена в e2e (ADR-0025): иначе виджет Cloudflare
      // отрендерился бы в headless-браузере, а сервер ходил бы в сеть.
      // Чтобы прогнать e2e с настоящей проверкой — задайте dummy-ключи
      // 1x00000000000000000000AA / 1x0000000000000000000000000000000AA.
      TURNSTILE_SITEKEY: '',
      TURNSTILE_SECRET_KEY: '',
      // Email-уведомления выключены в e2e (ADR-0026): без ключа отправка — no-op.
      EMAIL_API_KEY: '',
      REMINDERS_SECRET: '',
    },
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
