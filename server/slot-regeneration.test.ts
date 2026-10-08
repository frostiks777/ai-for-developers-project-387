// @vitest-environment node
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { loadAvailabilitySettings } from './availability-settings'
import { db } from './db'
import { bookings, eventTypes, slots } from './db/schema'
import { getDefaultHostId } from './test-helpers'
import type { BookingWithSlot, TimeSlot } from './types'

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
  it('слот вне сетки с отменённой бронью удаляется из таблицы при пересохранении', async () => {
    const hostId = await getDefaultHostId()
    const startAt = await freeOffGridStart()

    const [slot] = await db
      .insert(slots)
      .values({ hostId, startAt, durationMin: 30 })
      .returning()

    await addBooking(hostId, slot.id, startAt, 'cancelled')

    // До пересохранения слот ещё висит в таблице, но гостю уже не виден:
    // вне сетки он не выдаётся в любом случае.
    const before = await db.select({ id: slots.id }).from(slots).where(eq(slots.startAt, startAt))

    expect(before).toHaveLength(1)

    const guestBefore = await app.inject({ method: 'GET', url: '/api/slots' })

    expect(guestBefore.json<TimeSlot[]>().map((s) => s.startAt)).not.toContain(startAt)

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

describe('Историческая встреча вне сетки не видна гостю', () => {
  it('скрывает слот вне сетки, блокирует пересекающееся окно и остаётся в панели организатора', async () => {
    const hostId = await getDefaultHostId()
    const gridSlots = (await app.inject({ method: 'GET', url: '/api/slots' })).json<TimeSlot[]>()
    const gridSlot = gridSlots.find((slot) => !slot.isBooked)

    expect(gridSlot).toBeDefined()

    // Встреча, забронированная до фикса сетки: старт на 10 минут позже
    // получасового шага, минуты :10/:40 (ADR-0027).
    const offGridStart = new Date(new Date(gridSlot!.startAt).getTime() + 10 * 60_000).toISOString()

    const [offGridSlot] = await db
      .insert(slots)
      .values({ hostId, startAt: offGridStart, durationMin: 30 })
      .returning()

    await addBooking(hostId, offGridSlot.id, offGridStart, 'confirmed')

    const guest = (await app.inject({ method: 'GET', url: '/api/slots' })).json<TimeSlot[]>()
    const guestStarts = guest.map((slot) => slot.startAt)

    expect(guestStarts).not.toContain(offGridStart)
    // Пересекающееся получасовое окно занято исторической встречей
    expect(guestStarts).not.toContain(gridSlot!.startAt)
    expect(guest.every((slot) => new Date(slot.startAt).getUTCMinutes() % 30 === 0)).toBe(true)

    const v1 = (
      await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })
    ).json<{ slots: { startAt: string }[] }>()

    expect(v1.slots.map((slot) => slot.startAt)).not.toContain(offGridStart)

    const owner = (await app.inject({ method: 'GET', url: '/api/bookings' })).json<
      BookingWithSlot[]
    >()

    expect(owner.some((booking) => booking.startAt === offGridStart)).toBe(true)
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
