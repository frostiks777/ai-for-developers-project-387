// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { dateKeyInZone } from './hosts'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('GET /api/v1/hosts/:slug/settings', () => {
  it('отдаёт публичные настройки хоста по контракту', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/default/settings' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      slug: 'default',
      name: 'Организатор',
      timeZone: 'UTC',
      // CAPTCHA выключена, пока не задан TURNSTILE_SECRET_KEY (ADR-0025)
      captcha: { provider: 'turnstile', required: false, siteKey: null },
    })
  })

  it('отвечает 404 на неизвестный slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/unknown/settings' })

    expect(response.statusCode).toBe(404)
  })
})

type AvailabilityDay = {
  timeZone: string
  date: string | null
  slots: { id: number; startAt: string; durationMin: number; available: boolean }[]
}

describe('GET /api/v1/hosts/:slug/slots', () => {
  it('отдаёт список будущих слотов хоста', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })

    expect(response.statusCode).toBe(200)
    const day = response.json<AvailabilityDay>()
    expect(day.slots.length).toBeGreaterThan(0)
    expect(day.slots[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        startAt: expect.any(String),
        durationMin: expect.any(Number),
        available: expect.any(Boolean),
      }),
    )
  })

  it('фильтрует слоты по дате в заданном поясе', async () => {
    const all = (
      await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })
    ).json<AvailabilityDay>()
    const date = dateKeyInZone(all.slots[0].startAt, 'UTC')

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/hosts/default/slots?date=${date}&timezone=UTC`,
    })

    expect(response.statusCode).toBe(200)
    const filtered = response.json<AvailabilityDay>()
    expect(filtered.date).toBe(date)
    expect(filtered.slots.length).toBeGreaterThan(0)
    expect(filtered.slots.every((slot) => dateKeyInZone(slot.startAt, 'UTC') === date)).toBe(true)
  })

  it('отвечает 404 на неизвестный тип встречи', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/slots?eventTypeId=missing',
    })

    expect(response.statusCode).toBe(404)
  })

  it('отвечает 400 на некорректную дату', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/slots?date=24-09-2026',
    })

    expect(response.statusCode).toBe(400)
  })

  it('отвечает 400 на неизвестный часовой пояс', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/slots?timezone=Unknown/Zone',
    })

    expect(response.statusCode).toBe(400)
  })

  it('отвечает 404 на неизвестный slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/unknown/slots' })

    expect(response.statusCode).toBe(404)
  })
})
