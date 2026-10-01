import { z } from 'zod'

// Подгружаем .env в локальной разработке, если файл есть.
// В проде переменные приходят от платформы; уже заданные значения не перезаписываются.
try {
  process.loadEnvFile('.env')
} catch {
  // .env отсутствует — это нормально (прод/CI)
}

/**
 * Приводит SSL-режим в строке подключения к `verify-full`.
 *
 * Строку подключения формируют Neon и Render — вручную её править не нужно и
 * обычно нельзя, а по умолчанию там `sslmode=require`. В `pg-connection-string@2`
 * `require`, `verify-ca` и `verify-full` дают одинаковый конфиг (`ssl: {}`),
 * но `require` печатает предупреждение «SECURITY WARNING: ... are treated as
 * aliases for 'verify-full'». Подставляя `verify-full`, мы получаем тот же
 * конфиг без предупреждения — и не зависим от того, что вернёт провайдер.
 *
 * Проверено живым соединением: сервер требует TLS (без `sslmode` отдаёт
 * `28000 connection is insecure`), а `require`/`verify-full`/`prefer` подключаются
 * одинаково. Вариант `uselibpqcompat=true&sslmode=require` из самого
 * предупреждения не используем: он даёт `rejectUnauthorized: false`, то есть
 * отключает проверку сертификата.
 *
 * Правка только значения параметра, без пересборки URL через `new URL()` —
 * иначе пароль в строке подключения перекодируется и доступ к БД пропадёт.
 */
export function normalizeSslMode(connectionString: string): string {
  if (connectionString === '') {
    return ''
  }

  if (/[?&]sslmode=/.test(connectionString)) {
    return connectionString.replace(/([?&]sslmode=)[^&]*/, '$1verify-full')
  }

  return connectionString.includes('?')
    ? `${connectionString}&sslmode=verify-full`
    : `${connectionString}?sslmode=verify-full`
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Строка подключения Postgres (Neon). Пусто/не задано → PGlite (тесты, локальный dev).
  // SSL-режим нормализуется в verify-full: строку формирует Neon/Render,
  // где по умолчанию sslmode=require (см. normalizeSslMode ниже).
  DATABASE_URL: z
    .string()
    .trim()
    .optional()
    .transform((value) => normalizeSslMode(value || ''))
    .transform((value) => value || undefined)
    .refine(
      (value) => value === undefined || /^postgres(ql)?:\/\//.test(value),
      'DATABASE_URL должен быть строкой подключения Postgres',
    ),
  // Cloudflare Turnstile (ADR-0025). CAPTCHA включена, когда задан SECRET_KEY.
  // Без него капча выключена: виджет не рендерится, сервер не проверяет токен —
  // это делает локальный dev, npm test и e2e в CI независимыми от внешнего сервиса.
  TURNSTILE_SITEKEY: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  TURNSTILE_SECRET_KEY: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Список доменов через запятую, которым разрешено использовать site key.
  // Пусто — сверка hostname выключена. В Render задать список явно.
  TURNSTILE_ALLOWED_HOSTNAMES: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Лимиты запросов на один IP (ADR-0025). Дефолты — боевые значения;
  // в тестах поднимаются до неограниченно большого, чтобы существующие
  // наборы не упирались в счётчик (см. vite.config.ts → test.env).
  RATE_LIMIT_BOOKING_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_READ_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(600),
  // Email-уведомления (ADR-0026). Отправка включена, когда задан EMAIL_API_KEY
  // (Brevo HTTP API). Пусто → письма не отправляются (no-op): dev, npm test и
  // e2e в CI не зависят от внешнего сервиса. На Render SMTP заблокирован,
  // поэтому используется только HTTP API.
  EMAIL_API_KEY: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Отправитель в формате "Имя <email@example.com>"; email верифицируется в Brevo.
  EMAIL_FROM: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Reply-To — почта организатора, на неё гость может ответить.
  EMAIL_REPLY_TO: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Получатель писем организатору (новая бронь, отмена). Пусто — не шлём.
  ORGANIZER_EMAIL: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Напоминание за N минут до встречи (по умолчанию 24 ч).
  REMINDER_LEAD_MINUTES: z.coerce.number().int().positive().default(1440),
  // Секрет внешнего cron-endpoint /api/internal/reminders; не задан — endpoint выключен.
  REMINDERS_SECRET: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Базовый origin для абсолютных ссылок в письмах (fallback — RENDER_EXTERNAL_URL).
  APP_ORIGIN: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  // Render подставляет это значение сам — используем как fallback для ссылок в письмах.
  RENDER_EXTERNAL_URL: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
})

export const env = envSchema.parse(process.env)
