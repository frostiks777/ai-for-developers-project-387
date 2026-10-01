import { defineConfig } from 'drizzle-kit'

// Только для справки/генерации SQL-файлов (npm run db:generate).
// Реальные миграции — идемпотентный server/db/migrate.ts, выполняется при старте сервера.
export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
