// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { db } from './db'
import { bookings, slots } from './db/schema'
import { getDefaultHostId } from './test-helpers'
import type { Booking, BookingWithSlot, TimeSlot } from './types'

let app: FastifyInstance
let hostId: string

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
  hostId = await getDefaultHostId()
})

afterAll(async () => {
  await app.close()
})

async function requestSlots(): Promise<TimeSlot[]> {
  const response = await app.inject({ method: 'GET', url: '/api/slots' })

  expect(response.statusCode).toBe(200)
  return response.json<TimeSlot[]>()
}

function firstFreeSlot(allSlots: TimeSlot[]): TimeSlot {
  const slot = allSlots.find((item) => !item.isBooked)

  if (!slot) {
    throw new Error('В тестовой БД нет свободных слотов')
  }

  return slot
}

function validBody(slotId: number) {
  return {
    slotId,
    name: 'Иван',
    phone: '+79000000000',
    email: 'ivan@example.com',
  }
}

async function createFutureSlot() {
  return (
    await db
      .insert(slots)
      .values({
        hostId,
        startAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        durationMin: 30,
      })
      .returning()
  )[0]
}

describe('GET /health', () => {
  it('отвечает 200 со статусом ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })
})

describe('GET /api/slots', () => {
  it('не отдаёт прошедшие слоты', async () => {
    const pastStartAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    await db.insert(slots).values({ hostId, startAt: pastStartAt, durationMin: 30 })

    const allSlots = await requestSlots()
    const nowIso = new Date().toISOString()

    expect(allSlots.every((slot) => slot.startAt >= nowIso)).toBe(true)
    expect(allSlots.some((slot) => slot.startAt === pastStartAt)).toBe(false)
  })

  it('не отдаёт слоты в пределах minNotice', async () => {
    const soonStartAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    await db.insert(slots).values({ hostId, startAt: soonStartAt, durationMin: 30 })

    const allSlots = await requestSlots()

    expect(allSlots.some((slot) => slot.startAt === soonStartAt)).toBe(false)
  })

  // Спека: буферы не двигают сетку и не сдвигают старты соседних слотов (#89).
  it('отдаёт слоты получасовой сеткой независимо от буферов', async () => {
    const allSlots = await requestSlots()
    const minutes = allSlots.map((slot) => new Date(slot.startAt).getUTCMinutes())

    expect(minutes.every((minute) => minute === 0 || minute === 30)).toBe(true)
  })
})

describe('GET /api/bookings', () => {
  it('отвечает 200 и отдаёт брони с данными слота', async () => {
    const slot = firstFreeSlot(await requestSlots())

    const created = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(slot.id),
    })
    expect(created.statusCode).toBe(201)

    const response = await app.inject({ method: 'GET', url: '/api/bookings' })
    expect(response.statusCode).toBe(200)

    const booking = response
      .json<BookingWithSlot[]>()
      .find((item) => item.slotId === slot.id)

    expect(booking).toBeDefined()
    expect(booking?.email).toBe('ivan@example.com')
    expect(booking?.startAt).toBe(slot.startAt)
    expect(booking?.durationMin).toBe(slot.durationMin)
  })

  it('сортирует брони по времени начала слота', async () => {
    const freeSlots = (await requestSlots()).filter((item) => !item.isBooked)

    for (const slot of freeSlots.slice(0, 2)) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/bookings',
        payload: validBody(slot.id),
      })
      expect(response.statusCode).toBe(201)
    }

    const response = await app.inject({ method: 'GET', url: '/api/bookings' })
    const startAtList = response.json<BookingWithSlot[]>().map((item) => item.startAt)

    expect(startAtList).toEqual([...startAtList].sort())
  })
})

describe('целостность bookings.slotId', () => {
  it('запрещает вторую бронь на тот же слот на уровне БД', async () => {
    const slot = await createFutureSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(slot.id),
    })
    expect(response.statusCode).toBe(201)

    let uniqueCode: string | undefined

    try {
      await db.insert(bookings).values({
        hostId,
        slotId: slot.id,
        name: 'Пётр',
        phone: '+79100000001',
        email: 'petr@example.com',
        startAt: slot.startAt,
        endAt: new Date(new Date(slot.startAt).getTime() + slot.durationMin * 60_000).toISOString(),
      })
    } catch (error) {
      uniqueCode = (error as { cause?: { code?: string } }).cause?.code
    }

    expect(uniqueCode).toBe('23505')
  })
})

describe('POST /api/bookings', () => {
  it('создаёт бронь и возвращает 201', async () => {
    const slot = firstFreeSlot(await requestSlots())

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(slot.id),
    })

    expect(response.statusCode).toBe(201)
    const booking = response.json<Booking>()
    expect(booking.slotId).toBe(slot.id)
    expect(booking.email).toBe('ivan@example.com')

    const updatedSlot = (await requestSlots()).find((item) => item.id === slot.id)
    expect(updatedSlot?.isBooked).toBe(true)
  })

  it('сохраняет комментарий и отдаёт его в GET /api/bookings', async () => {
    const slot = await createFutureSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...validBody(slot.id), comment: 'Хочу обсудить архитектуру' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json<Booking>().comment).toBe('Хочу обсудить архитектуру')

    const list = (await app.inject({ method: 'GET', url: '/api/bookings' })).json<BookingWithSlot[]>()
    expect(list.find((item) => item.slotId === slot.id)?.comment).toBe('Хочу обсудить архитектуру')
  })

  it('сохраняет null, если комментарий не передан', async () => {
    const slot = await createFutureSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(slot.id),
    })

    expect(response.statusCode).toBe(201)
    expect(response.json<Booking>().comment).toBeNull()
  })

  it('создаёт бронь без телефона и сохраняет null', async () => {
    const slot = await createFutureSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { slotId: slot.id, name: 'Иван', email: 'ivan@example.com' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json<Booking>().phone).toBeNull()
  })

  it('считает пустой телефон отсутствующим', async () => {
    const slot = await createFutureSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...validBody(slot.id), phone: '   ' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json<Booking>().phone).toBeNull()
  })

  it('сохраняет null для пустого комментария', async () => {
    const slot = await createFutureSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...validBody(slot.id), comment: '   ' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json<Booking>().comment).toBeNull()
  })

  it('отвечает 409 на повторную бронь того же слота', async () => {
    const slot = firstFreeSlot(await requestSlots())

    const first = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(slot.id),
    })
    expect(first.statusCode).toBe(201)

    const second = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(slot.id),
    })
    expect(second.statusCode).toBe(409)
  })

  it('отвечает 404 для несуществующего слота', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(999999),
    })

    expect(response.statusCode).toBe(404)
  })

  it.each([
    ['без email', { email: undefined }],
    ['с невалидным email', { email: 'not-an-email' }],
    ['с пустым именем', { name: '   ' }],
    ['с невалидным телефоном', { phone: 'abcdef' }],
    ['с коротким телефоном', { phone: '+7 900' }],
    ['с слишком длинным комментарием', { comment: 'x'.repeat(1001) }],
    ['без slotId', { slotId: undefined }],
  ])('отвечает 422 %s', async (_case, overrides) => {
    const slot = firstFreeSlot(await requestSlots())

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: { ...validBody(slot.id), ...overrides },
    })

    expect(response.statusCode).toBe(422)
  })

  it('отвечает 400, если слот прошедший', async () => {
    const pastStartAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const pastSlot = (
      await db.insert(slots).values({ hostId, startAt: pastStartAt, durationMin: 30 }).returning()
    )[0]

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(pastSlot.id),
    })

    expect(response.statusCode).toBe(400)
  })

  it('отвечает 400, если до слота меньше minNotice', async () => {
    const soonStartAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    const soonSlot = (
      await db.insert(slots).values({ hostId, startAt: soonStartAt, durationMin: 30 }).returning()
    )[0]

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: validBody(soonSlot.id),
    })

    expect(response.statusCode).toBe(400)
  })
})