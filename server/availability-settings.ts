import { and, eq, gte } from 'drizzle-orm'

import {
  defaultAvailabilityRules,
  generateSlotStartsFromRanges,
  rangesFromRules,
  windowFromRanges,
  type AvailabilitySettings,
} from './availability'
import { db } from './db'
import { availabilityRanges, hosts, slots } from './db/schema'
import { loadAvailabilityRules, purgeUnpinnedFutureSlots, saveAvailabilityRules } from './rules'

export async function loadAvailabilitySettings(
  hostId: string,
  timeZone: string,
): Promise<AvailabilitySettings> {
  const rules = await loadAvailabilityRules(hostId)
  const rows = await db
    .select()
    .from(availabilityRanges)
    .where(eq(availabilityRanges.hostId, hostId))
    .orderBy(availabilityRanges.weekday, availabilityRanges.startMinute)

  const ranges =
    rows.length > 0
      ? rows.map((row) => ({
          weekday: row.weekday,
          startMinute: row.startMinute,
          endMinute: row.endMinute,
        }))
      : rangesFromRules(rules)

  return {
    timeZone,
    slotDurationMin: rules.slotDurationMin,
    bufferBeforeMin: rules.bufferBeforeMin,
    bufferAfterMin: rules.bufferAfterMin,
    minNoticeMin: rules.minNoticeMin,
    horizonDays: rules.horizonDays,
    ranges,
  }
}

export async function saveAvailabilitySettings(
  hostId: string,
  settings: AvailabilitySettings,
): Promise<void> {
  const window = windowFromRanges(settings.ranges, defaultAvailabilityRules)

  await saveAvailabilityRules(hostId, {
    ...window,
    slotDurationMin: settings.slotDurationMin,
    bufferBeforeMin: settings.bufferBeforeMin,
    bufferAfterMin: settings.bufferAfterMin,
    minNoticeMin: settings.minNoticeMin,
    horizonDays: settings.horizonDays,
  })

  await db.delete(availabilityRanges).where(eq(availabilityRanges.hostId, hostId))

  if (settings.ranges.length > 0) {
    await db
      .insert(availabilityRanges)
      .values(settings.ranges.map((range) => ({ hostId, ...range })))
  }

  await regenerateFutureSlotsForSettings(hostId, settings)
}

// Пересобирает будущие слоты хоста под настройки, не трогая занятые слоты.
// Слот закреплён только брони в статусе confirmed — см. purgeUnpinnedFutureSlots.
export async function regenerateFutureSlotsForSettings(
  hostId: string,
  settings: AvailabilitySettings,
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

  const newStarts = generateSlotStartsFromRanges(now, settings).filter(
    (startAt) => !existingStarts.has(startAt),
  )

  if (newStarts.length > 0) {
    await db.insert(slots).values(
      newStarts.map((startAt) => ({
        hostId,
        startAt,
        durationMin: settings.slotDurationMin,
      })),
    )
  }
}

// Приводит слоты всех хостов в соответствие с их настройками при старте сервера.
// Без этого фикс не доходит до данных, застывших до его появления: регенерация
// иначе срабатывает только когда организатор руками сохранит доступность (#97).
export async function regenerateAllHostsSlots(): Promise<number> {
  const rows = await db.select({ id: hosts.id, timezone: hosts.timezone }).from(hosts)

  for (const host of rows) {
    const settings = await loadAvailabilitySettings(host.id, host.timezone)

    await regenerateFutureSlotsForSettings(host.id, settings)
  }

  return rows.length
}
