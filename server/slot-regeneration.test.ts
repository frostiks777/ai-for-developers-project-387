// @vitest-environment node
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { loadAvailabilitySettings } from './availability-settings'
import { db } from './db'
import { bookings, eventTypes, slots } from './db/schema'
import { getDefaultHostId } from './test-helpers'
import type { TimeSlot } from './types'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

afterEach(async () => {
  await db.delete(bookings)
})

// Будущее время, которого нет в таблице слотов и минуты которого не кратны 30
// (например 09:40) — наследие старой формулы шага сетки (ADR-0027, #97).
async function freeOffGridStart(): Promise<string> {
  for (let dayOffset = 1; dayOffset <= 13; dayOffset += 1) {
    const candidate = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1000)

    candidate.setUTCHours(9, 40, 0, 0)

    const startAt = candidate.toISOString()

    if (new Date(startAt).getUTCMinutes() % 30 === 0) {
      continue
    }

    const taken = await db.select({ id: slots.id }).from(slots).where(eq(slots.startAt, startAt))

    if (taken.length === 0) {
      return startAt
    }
  }

  throw new Error('Не нашлось свободного будущего времени вне сетки')
}

async function eventTypeId(): Promise<string> {
  const rows = await db.select({ id: eventTypes.id }).from(eventTypes).limit(1)

  return rows[0].id
}

async function addBooking(
  hostId: string,
  slotId: number,
  startAt: string,
  status: 'confirmed' | 'cancelled',
): Promise<void> {
  await db.insert(bookings).values({
    hostId,
    slotId,
    eventTypeId: await eventTypeId(),
    name: 'Гость',
    phone: '+7 900 000-00-00',
    email: 'guest@example.com',
    consentAccepted: true,
    status,
    startAt,
    endAt: new Date(new Date(startAt).getTime() + 30 * 60_000).toISOString(),
  })
}

// Пересохранение настроек — единственный публичный триггер регенерации слотов
async function resaveSettings(): Promise<void> {
  const settings = await loadAvailabilitySettings(await getDefaultHostId(), 'Europe/Moscow')

  const response = await app.inject({
    method: 'PUT',
    url: '/api/v1/hosts/default/availability',
    payload: settings,
  })

  expect(response.statusCode).toBe(200)
}

describe('Отменённая бронь не закрепляет слот (#97)', () => {
  it('слот вне сетки с отменённой бронью исчезает из календаря после пересохранения', async () => {
    const hostId = await getDefaultHostId()
    const startAt = await freeOffGridStart()

    const [slot] = await db
      .insert(slots)
      .values({ hostId, startAt, durationMin: 30 })
      .returning()

    await addBooking(hostId, slot.id, startAt, 'cancelled')

    // До пересохранения слот висит в таблице и отдаётся гостю как свободный.
    const before = await app.inject({ method: 'GET', url: '/api/slots' })

    expect(before.json<TimeSlot[]>().map((s) => s.startAt)).toContain(startAt)

    await resaveSettings()

    const rows = await db.select({ id: slots.id }).from(slots).where(eq(slots.startAt, startAt))

    expect(rows).toHaveLength(0)

    const stale = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.slotId, slot.id))

    expect(stale).toHaveLength(0)

    const after = await app.inject({ method: 'GET', url: '/api/slots' })

    expect(after.json<TimeSlot[]>().map((s) => s.startAt)).not.toContain(startAt)
  })

  it('подтверждённая бронь по-прежнему закрепляет слот', async () => {
    const hostId = await getDefaultHostId()
    const startAt = await freeOffGridStart()

    const [slot] = await db
      .insert(slots)
      .values({ hostId, startAt, durationMin: 30 })
      .returning()

    await addBooking(hostId, slot.id, startAt, 'confirmed')

    await resaveSettings()

    const rows = await db.select({ id: slots.id }).from(slots).where(eq(slots.startAt, startAt))

    expect(rows).toHaveLength(1)
  })
})

describe('Горизонт записи соблюдается в ответе (#97)', () => {
  it('GET /api/slots не отдаёт слоты дальше горизонта хоста', async () => {
    const hostId = await getDefaultHostId()
    const settings = await loadAvailabilitySettings(hostId, 'Europe/Moscow')

    const farFuture = new Date(Date.now() + (settings.horizonDays + 3) * 24 * 60 * 60 * 1000)

    farFuture.setUTCHours(11, 0, 0, 0)

    const [slot] = await db
      .insert(slots)
      .values({ hostId, startAt: farFuture.toISOString(), durationMin: 30 })
      .returning()

    // Даже занятый слот дальше горизонта гостю не показываем.
    await addBooking(hostId, slot.id, farFuture.toISOString(), 'confirmed')

    const response = await app.inject({ method: 'GET', url: '/api/slots' })
    const starts = response.json<TimeSlot[]>().map((s) => s.startAt)

    expect(starts).not.toContain(farFuture.toISOString())
  })
})
