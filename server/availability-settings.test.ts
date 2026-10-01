// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

type Settings = {
  timeZone: string
  slotDurationMin: number
  bufferBeforeMin: number
  bufferAfterMin: number
  minNoticeMin: number
  horizonDays: number
  ranges: { weekday: number; startMinute: number; endMinute: number }[]
}

describe('GET /api/v1/hosts/:slug/availability', () => {
  it('отдаёт диапазоны, выведенные из дефолтного окна', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/availability',
    })

    expect(response.statusCode).toBe(200)
    const settings = response.json<Settings>()
    expect(settings.ranges).toHaveLength(5)
    expect(settings.ranges.map((range) => range.weekday)).toEqual([1, 2, 3, 4, 5])
    expect(settings.ranges[0]).toEqual({ weekday: 1, startMinute: 600, endMinute: 1080 })
  })

  it('отвечает 404 на неизвестный slug', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/unknown/availability',
    })

    expect(response.statusCode).toBe(404)
  })
})

describe('PUT /api/v1/hosts/:slug/availability', () => {
  it('сохраняет несколько интервалов и пересобирает слоты', async () => {
    const payload: Settings = {
      timeZone: 'UTC',
      slotDurationMin: 30,
      bufferBeforeMin: 0,
      bufferAfterMin: 0,
      minNoticeMin: 0,
      horizonDays: 14,
      ranges: [
        { weekday: 1, startMinute: 540, endMinute: 600 },
        { weekday: 1, startMinute: 780, endMinute: 840 },
        { weekday: 3, startMinute: 600, endMinute: 660 },
      ],
    }

    const put = await app.inject({
      method: 'PUT',
      url: '/api/v1/hosts/default/availability',
      payload,
    })
    expect(put.statusCode).toBe(200)

    const get = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/availability',
    })
    const settings = get.json<Settings>()
    expect(settings.ranges).toEqual(payload.ranges)
    expect(settings.slotDurationMin).toBe(30)

    const slots = (
      await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })
    ).json<{ slots: { startAt: string }[] }>().slots
    expect(slots.length).toBeGreaterThan(0)

    for (const slot of slots) {
      const date = new Date(slot.startAt)
      const weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay()
      const minute = date.getUTCHours() * 60 + date.getUTCMinutes()
      const allowed = payload.ranges.some(
        (range) =>
          range.weekday === weekday &&
          minute >= range.startMinute &&
          minute + payload.slotDurationMin <= range.endMinute,
      )
      expect(allowed).toBe(true)
    }
  })

  it('отклоняет интервал с концом раньше начала (422)', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/hosts/default/availability',
      payload: {
        timeZone: 'UTC',
        slotDurationMin: 30,
        bufferBeforeMin: 0,
      bufferAfterMin: 0,
        minNoticeMin: 0,
        horizonDays: 14,
        ranges: [{ weekday: 2, startMinute: 600, endMinute: 540 }],
      },
    })

    expect(response.statusCode).toBe(422)
  })

  it('PUT с новым поясом меняет settings.timeZone в ответе (ADR-0024)', async () => {
    // Отдельный хост, чтобы не менять пояс дефолтного для других тестов
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts',
      payload: { slug: 'tz-host', name: 'TZ', timezone: 'UTC' },
    })
    expect(created.statusCode).toBe(201)

    const put = await app.inject({
      method: 'PUT',
      url: '/api/v1/hosts/tz-host/availability',
      payload: {
        timeZone: 'Europe/Moscow',
        slotDurationMin: 40,
        bufferBeforeMin: 0,
        bufferAfterMin: 0,
        minNoticeMin: 0,
        horizonDays: 1,
        ranges: [{ weekday: 1, startMinute: 600, endMinute: 660 }],
      },
    })

    expect(put.statusCode).toBe(200)
    expect(put.json<Settings>().timeZone).toBe('Europe/Moscow')

    const settings = (
      await app.inject({ method: 'GET', url: '/api/v1/hosts/tz-host/availability' })
    ).json<Settings>()
    expect(settings.timeZone).toBe('Europe/Moscow')
  })
})
