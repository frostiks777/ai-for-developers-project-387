import { sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { defaultHost } from '../hosts'
import { DEFAULT_EVENT_TYPE_ID, eventTypes, hosts } from './schema'
import type * as schema from './schema'

export type Db = NodePgDatabase<typeof schema>

// DDL создаётся при старте, если таблиц ещё нет (идемпотентно).
// camelCase-колонки требуют кавычек: Postgres чувствителен к регистру идентификаторов.
const statements = [
  `CREATE TABLE IF NOT EXISTS hosts (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" TEXT NOT NULL DEFAULT (now()::text)
  )`,
  `CREATE TABLE IF NOT EXISTS slots (
    id SERIAL PRIMARY KEY,
    "hostId" TEXT NOT NULL REFERENCES hosts(id),
    "startAt" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30
  )`,
  `CREATE TABLE IF NOT EXISTS event_types (
    id TEXT PRIMARY KEY,
    "hostId" TEXT NOT NULL REFERENCES hosts(id),
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "locationType" TEXT NOT NULL DEFAULT 'online',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TEXT NOT NULL DEFAULT (now()::text)
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "event_types_host_slug_unique" ON event_types("hostId", slug)`,
  `CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    "hostId" TEXT NOT NULL REFERENCES hosts(id),
    "slotId" INTEGER NOT NULL REFERENCES slots(id),
    "eventTypeId" TEXT NOT NULL DEFAULT '${DEFAULT_EVENT_TYPE_ID}' REFERENCES event_types(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    comment TEXT,
    guests TEXT,
    "consentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    "cancellationReason" TEXT,
    "startAt" TEXT NOT NULL,
    "endAt" TEXT NOT NULL,
    "cancelToken" TEXT,
    "reminderSentAt" TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (now()::text)
  )`,
  `CREATE TABLE IF NOT EXISTS availability_rules (
    "hostId" TEXT REFERENCES hosts(id),
    weekdays TEXT NOT NULL,
    "windowStartHour" INTEGER NOT NULL,
    "windowEndHour" INTEGER NOT NULL,
    "slotDurationMin" INTEGER NOT NULL,
    "bufferMin" INTEGER NOT NULL DEFAULT 0,
    "bufferBeforeMin" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMin" INTEGER NOT NULL DEFAULT 0,
    "minNoticeMin" INTEGER NOT NULL,
    "horizonDays" INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS availability_ranges (
    id SERIAL PRIMARY KEY,
    "hostId" TEXT NOT NULL REFERENCES hosts(id),
    weekday INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS time_blocks (
    id SERIAL PRIMARY KEY,
    "hostId" TEXT NOT NULL REFERENCES hosts(id),
    "startAt" TEXT NOT NULL,
    "endAt" TEXT NOT NULL,
    reason TEXT,
    "createdAt" TEXT NOT NULL DEFAULT (now()::text)
  )`,
  // Уникальность слота — только для активных броней (ADR-0011)
  `CREATE UNIQUE INDEX IF NOT EXISTS "bookings_slotId_active_unique"
     ON bookings("slotId") WHERE status <> 'cancelled'`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "bookings_cancelToken_unique" ON bookings("cancelToken")`,
  // ADD COLUMN IF NOT EXISTS — идемпотентно для БД, созданных до появления колонок
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guests TEXT`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "consentAccepted" BOOLEAN NOT NULL DEFAULT false`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "bookings_idempotencyKey_unique" ON bookings("idempotencyKey")`,
  // Напоминания о встрече (ADR-0026): время отправки, null — ещё не отправляли
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "reminderSentAt" TEXT`,
  // Буферы до/после встречи: аддитивно + бэкфилл из легаси-bufferMin (ADR-0016)
  `ALTER TABLE availability_rules ADD COLUMN IF NOT EXISTS "bufferMin" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE availability_rules ALTER COLUMN "bufferMin" SET DEFAULT 0`,
  `ALTER TABLE availability_rules ADD COLUMN IF NOT EXISTS "bufferBeforeMin" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE availability_rules ADD COLUMN IF NOT EXISTS "bufferAfterMin" INTEGER NOT NULL DEFAULT 0`,
  `UPDATE availability_rules SET "bufferAfterMin" = "bufferMin"
     WHERE "bufferAfterMin" = 0 AND "bufferMin" <> 0`,
  // Правила стали per-host (ADR-0018): убираем глобальный id у старых БД
  `ALTER TABLE availability_rules DROP CONSTRAINT IF EXISTS availability_rules_pkey`,
  `ALTER TABLE availability_rules DROP COLUMN IF EXISTS id`,
]

/** Гарантирует наличие дефолтного хоста и возвращает его id. */
async function ensureDefaultHost(db: Db): Promise<string> {
  const existing = await db.select({ id: hosts.id }).from(hosts).limit(1)

  if (existing.length > 0) return existing[0].id

  const id = crypto.randomUUID()
  await db.insert(hosts).values({ id, ...defaultHost })
  return id
}

/** Гарантирует наличие дефолтного типа встречи. */
async function ensureDefaultEventType(db: Db, hostId: string): Promise<void> {
  await db
    .insert(eventTypes)
    .values({
      id: DEFAULT_EVENT_TYPE_ID,
      hostId,
      slug: 'consultation',
      title: 'Звонок-консультация',
      description: null,
      durationMin: 30,
      locationType: 'online',
      isActive: true,
    })
    .onConflictDoNothing({ target: eventTypes.id })
}

/**
 * Идемпотентные миграции схемы: создаёт недостающие таблицы и индексы
 * и заводит дефолтный хост и тип встречи. Безопасно вызывать при каждом старте.
 */
export async function runMigrations(db: Db): Promise<string> {
  for (const statement of statements) {
    await db.execute(sql.raw(statement))
  }

  const hostId = await ensureDefaultHost(db)
  await ensureDefaultEventType(db, hostId)

  // Привязка slots/bookings к хосту (ADR-0018): аддитивно, с бэкфиллом
  // существующих строк на дефолтный хост. hostId — UUID из кода, не из ввода.
  const hostScopedStatements = [
    `ALTER TABLE slots ADD COLUMN IF NOT EXISTS "hostId" TEXT REFERENCES hosts(id)`,
    `UPDATE slots SET "hostId" = '${hostId}' WHERE "hostId" IS NULL`,
    `ALTER TABLE slots ALTER COLUMN "hostId" SET NOT NULL`,
    `CREATE INDEX IF NOT EXISTS slots_hostId_idx ON slots("hostId")`,
    `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "hostId" TEXT REFERENCES hosts(id)`,
    `UPDATE bookings b SET "hostId" = et."hostId" FROM event_types et
       WHERE b."eventTypeId" = et.id AND b."hostId" IS NULL`,
    `UPDATE bookings SET "hostId" = '${hostId}' WHERE "hostId" IS NULL`,
    `ALTER TABLE bookings ALTER COLUMN "hostId" SET NOT NULL`,
    `CREATE INDEX IF NOT EXISTS bookings_hostId_idx ON bookings("hostId")`,
    // Правила доступности — одна строка на хоста (ADR-0018): бэкфилл, NOT NULL, UNIQUE
    `UPDATE availability_rules SET "hostId" = '${hostId}' WHERE "hostId" IS NULL`,
    `ALTER TABLE availability_rules ALTER COLUMN "hostId" SET NOT NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "availability_rules_hostId_unique" ON availability_rules("hostId")`,
  ]

  for (const statement of hostScopedStatements) {
    await db.execute(sql.raw(statement))
  }

  return hostId
}
