import { and, eq, gte, inArray } from 'drizzle-orm'

import {
  defaultAvailabilityRules,
  generateSlotStarts,
  rulesFromRow,
  rulesToRow,
  type AvailabilityRules,
} from './availability'
import { db } from './db'
import { availabilityRules, bookings, slots } from './db/schema'

// Правила доступности хранятся по одной строке на хоста (ADR-0018)
export async function loadAvailabilityRules(hostId: string): Promise<AvailabilityRules> {
  const rows = await db
    .select()
    .from(availabilityRules)
    .where(eq(availabilityRules.hostId, hostId))
    .limit(1)
  const row = rows[0]

  return row ? rulesFromRow(row) : defaultAvailabilityRules
}

export async function saveAvailabilityRules(
  hostId: string,
  rules: AvailabilityRules,
): Promise<void> {
  const row = rulesToRow(rules)

  await db
    .insert(availabilityRules)
    .values({ hostId, ...row })
    .onConflictDoUpdate({ target: availabilityRules.hostId, set: row })
}

// Удаляет будущие слоты, которые больше не закреплены подтверждённой бронью.
// Отменённая бронь слот не удерживает: из-за этого слот со старой сетки жил
// вечно и отдавался гостю как свободный, хотя минута не кратна шагу (#97).
// FK bookings.slotId → slots.id с NO ACTION, поэтому не-confirmed брони
// снимаются вместе со слотом — иначе удаление слота упрётся в нарушение FK.
export async function purgeUnpinnedFutureSlots(hostId: string): Promise<void> {
  const nowIso = new Date().toISOString()

  const futureSlots = await db
    .select({ id: slots.id, bookingId: bookings.id })
    .from(slots)
    .leftJoin(
      bookings,
      and(eq(bookings.slotId, slots.id), eq(bookings.status, 'confirmed')),
    )
    .where(and(eq(slots.hostId, hostId), gte(slots.startAt, nowIso)))

  const staleIds = [
    ...new Set(futureSlots.filter((slot) => slot.bookingId === null).map((slot) => slot.id)),
  ]

  if (staleIds.length === 0) {
    return
  }

  await db.transaction(async (tx) => {
    await tx.delete(bookings).where(inArray(bookings.slotId, staleIds))
    await tx.delete(slots).where(inArray(slots.id, staleIds))
  })
}

// Пересобирает будущие слоты хоста под новые правила, не трогая занятые слоты:
// удаляет свободные будущие слоты и добавляет недостающие по новому расписанию
export async function regenerateFutureSlots(
  hostId: string,
  rules: AvailabilityRules,
): Promise<void> {
  const now = new Date()
  const nowIso = now.toISOString()

  await purgeUnpinnedFutureSlots(hostId)

  const existingStarts = new Set(
    (
      await db
        .select({ startAt: slots.startAt })
        .from(slots)
        .where(and(eq(slots.hostId, hostId), gte(slots.startAt, nowIso)))
    ).map((slot) => slot.startAt),
  )

  const newStarts = generateSlotStarts(now, rules).filter((startAt) => !existingStarts.has(startAt))

  if (newStarts.length > 0) {
    await db
      .insert(slots)
      .values(newStarts.map((startAt) => ({ hostId, startAt, durationMin: rules.slotDurationMin })))
  }
}
