import { randomUUID } from 'node:crypto'
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { and, eq, gte, isNull } from 'drizzle-orm'
import { Pool } from 'pg'
import { defaultAvailabilityRules, generateSlotStarts, rulesFromRow } from '../availability'
import { env } from '../env'
import { runMigrations, type Db } from './migrate'
import * as schema from './schema'

// DATABASE_URL (Neon/Postgres) — прод и dev. Если не задан (тесты, локальная
// разработка без Postgres) — используется PGlite (WASM-Postgres в процессе).
async function createDb(): Promise<Db> {
  if (env.DATABASE_URL) {
    const pool = new Pool({ connectionString: env.DATABASE_URL, max: 5 })
    return drizzlePg(pool, { schema })
  }

  // Динамический импорт: PGlite — devDependency, в проде не нужен и не попадает в образ
  const [{ PGlite }, { drizzle: drizzlePglite }] = await Promise.all([
    import('@electric-sql/pglite'),
    import('drizzle-orm/pglite'),
  ])
  const pglite = new PGlite()
  return drizzlePglite(pglite, { schema }) as unknown as NodePgDatabase<typeof schema>
}

export const db = await createDb()

const defaultHostId = await runMigrations(db)

// Хостам без единого типа встречи заводим дефолтный: без него гость не может
// завершить бронь (eventTypeId обязателен). Идемпотентно — при каждом старте.
const hostsWithoutEventTypes = await db
  .select({ id: schema.hosts.id })
  .from(schema.hosts)
  .leftJoin(schema.eventTypes, eq(schema.eventTypes.hostId, schema.hosts.id))
  .where(isNull(schema.eventTypes.id))

if (hostsWithoutEventTypes.length > 0) {
  await db.insert(schema.eventTypes).values(
    hostsWithoutEventTypes.map((host) => ({
      id: randomUUID(),
      hostId: host.id,
      slug: 'consultation',
      title: 'Звонок-консультация',
      description: null,
      durationMin: 30,
      locationType: 'online',
      isActive: true,
    })),
  )
}

// Сидирование дефолтного хоста и типа встречи выполняет runMigrations;
// здесь гарантируем наличие будущих слотов по сохранённым правилам доступности.
const storedRules = (
  await db
    .select()
    .from(schema.availabilityRules)
    .where(eq(schema.availabilityRules.hostId, defaultHostId))
    .limit(1)
)[0]
const rules = storedRules ? rulesFromRow(storedRules) : defaultAvailabilityRules

const hasFutureSlots =
  (
    await db
      .select({ id: schema.slots.id })
      .from(schema.slots)
      .where(
        and(
          eq(schema.slots.hostId, defaultHostId),
          gte(schema.slots.startAt, new Date().toISOString()),
        ),
      )
      .limit(1)
  ).length > 0

if (!hasFutureSlots) {
  const slotStarts = generateSlotStarts(new Date(), rules)

  if (slotStarts.length > 0) {
    await db.insert(schema.slots).values(
      slotStarts.map((startAt) => ({
        hostId: defaultHostId,
        startAt,
        durationMin: rules.slotDurationMin,
      })),
    )
  }
}
