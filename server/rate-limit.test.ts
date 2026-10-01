// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { env } from './env'

// Rate-limit по IP для публичных операций брони (ADR-0025).
// Ключевой момент этих тестов — корректное определение IP за прокси: на Render
// реальный запрос приходит через Cloudflare, и без учёта заголовков все гости
// делили бы один счётчик.
//
// vite.config.ts поднимает лимиты для набора тестов до несущественности,
// поэтому здесь задаём свой, маленький — иначе тест гонял бы 100000 запросов.

const TIGHT_LIMIT = 3

let app: FastifyInstance
let originalBookingMax: number

beforeAll(async () => {
  originalBookingMax = env.RATE_LIMIT_BOOKING_MAX
  env.RATE_LIMIT_BOOKING_MAX = TIGHT_LIMIT

  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
  env.RATE_LIMIT_BOOKING_MAX = originalBookingMax
})

// Тело заведомо невалидное: rate-limit живёт на onRequest, поэтому счётчик
// растёт независимо от результата валидации, а база не затрагивается.
const badPayload = { eventTypeId: '', startAt: '', clientName: '' }

const createBooking = (ip: string, extraHeaders: Record<string, string> = {}) =>
  app.inject({
    method: 'POST',
    url: '/api/v1/hosts/default/bookings',
    remoteAddress: ip,
    headers: extraHeaders,
    payload: badPayload,
  })

describe('rate-limit создания брони', () => {
  it(`отдаёт 429 на ${TIGHT_LIMIT + 1}-м запросе с одного IP`, async () => {
    const ip = '203.0.113.10'

    for (let i = 0; i < TIGHT_LIMIT; i += 1) {
      const response = await createBooking(ip)
      expect(response.statusCode).toBe(422)
    }

    const limited = await createBooking(ip)

    expect(limited.statusCode).toBe(429)
    const body = limited.json<{ error: { code: string; message: string } }>()
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(limited.headers['retry-after']).toBeTruthy()
  })

  it('разные IP не делят счётчик', async () => {
    const noisy = '203.0.113.20'
    const quiet = '198.51.100.20'

    for (let i = 0; i < TIGHT_LIMIT; i += 1) {
      await createBooking(noisy)
    }
    expect((await createBooking(noisy)).statusCode).toBe(429)

    // Если бы IP не различались (например, trustProxy не настроен и все
    // запросы приходят с адреса прокси), второй IP тоже получил бы 429.
    expect((await createBooking(quiet)).statusCode).toBe(422)
  })

  it('различает гостей по CF-Connecting-IP (схема Render за Cloudflare)', async () => {
    const noisy = '203.0.113.30'
    const quiet = '198.51.100.30'
    // Реальные заголовки, которые видит сервис на Render: Cloudflare
    // перезаписывает CF-Connecting-IP и дописывает цепочку в X-Forwarded-For.
    const renderHeaders = (clientIp: string) => ({
      'cf-connecting-ip': clientIp,
      'x-forwarded-for': `${clientIp}, 172.71.195.123`,
    })

    for (let i = 0; i < TIGHT_LIMIT; i += 1) {
      await createBooking('10.226.90.65', renderHeaders(noisy))
    }
    expect((await createBooking('10.226.90.65', renderHeaders(noisy))).statusCode).toBe(429)

    // Если бы IP не различались (например, trustProxy не настроен и все
    // запросы приходят с адреса прокси), второй IP тоже получил бы 429.
    expect((await createBooking('10.226.90.65', renderHeaders(quiet))).statusCode).toBe(422)
  })

  it('без CF-Connecting-IP берёт IP из X-Forwarded-For, а не с адреса прокси', async () => {
    const noisy = '203.0.113.60'
    const quiet = '198.51.100.60'
    const chain = (clientIp: string) => ({ 'x-forwarded-for': `${clientIp}, 172.71.195.123` })

    for (let i = 0; i < TIGHT_LIMIT; i += 1) {
      await createBooking('10.226.90.65', chain(noisy))
    }
    expect((await createBooking('10.226.90.65', chain(noisy))).statusCode).toBe(429)
    expect((await createBooking('10.226.90.65', chain(quiet))).statusCode).toBe(422)
  })
})

describe('rate-limit публичных чтений', () => {
  it('не мешает гостю на странице записи', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/hosts/default/slots',
      remoteAddress: '203.0.113.40',
    })

    expect(response.statusCode).toBe(200)
  })
})
