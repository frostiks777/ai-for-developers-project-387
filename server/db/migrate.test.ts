// @vitest-environment node
import { PGlite } from '@electric-sql/pglite'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { describe, expect, it } from 'vitest'
import { runMigrations } from './migrate'
import * as schema from './schema'

// PGlite — WASM-Postgres в процессе: тот же SQL-диалект, что у Neon, без внешней БД.
function createPgliteDb(): NodePgDatabase<typeof schema> {
  const client = new PGlite()
  return drizzle(client, { schema }) as unknown as NodePgDatabase<typeof schema>
}

describe('runMigrations', () => {
  it('создаёт таблицы и идемпотентна при повторном запуске', async () => {
    const db = createPgliteDb()

    await runMigrations(db)
    await runMigrations(db)

    const tables = await db.execute<{ tablename: string }>(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    )
    expect(tables.rows.map((row) => row.tablename)).toEqual(
      expect.arrayContaining([
        'slots',
        'bookings',
        'hosts',
        'event_types',
        'availability_rules',
        'availability_ranges',
      ]),
    )

    const indexes = await db.execute<{ indexname: string }>(
      sql`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`,
    )
    expect(indexes.rows.map((row) => row.indexname)).toContain('bookings_slotId_active_unique')

    const types = await db.select().from(schema.eventTypes)
    expect(types.some((type) => type.id === 'default-consultation')).toBe(true)
  }, 30_000)

  it('отменённая бронь не блокирует повторную запись (partial unique index)', async () => {
    const db = createPgliteDb()
    const hostId = await runMigrations(db)

    const startAt = '2026-10-01T10:00:00.000Z'
    const endAt = '2026-10-01T10:30:00.000Z'
    const slot = (
      await db.insert(schema.slots).values({ hostId, startAt, durationMin: 30 }).returning()
    )[0]

    const booking = (
      await db
        .insert(schema.bookings)
        .values({ hostId, slotId: slot.id, name: 'Иван', email: 'ivan@example.com', startAt, endAt })
        .returning()
    )[0]

    await db
      .update(schema.bookings)
      .set({ status: 'cancelled' })
      .where(sql`${schema.bookings.id} = ${booking.id}`)

    await expect(
      db
        .insert(schema.bookings)
        .values({ hostId, slotId: slot.id, name: 'Пётр', email: 'petr@example.com', startAt, endAt }),
    ).resolves.toBeDefined()
  }, 30_000)
})
