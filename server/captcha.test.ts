// @vitest-environment node
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { env } from './env'

// Реальный (не dummy) секрет: включает проверку hostname в captcha.ts.
// URL siteverify подменяется через stubbed fetch — наружу не ходим.
const REAL_SECRET = '0x4AAAATESTREALSECRET'
const SITE_KEY = '0x4AAAATESTSITEKEY'

let app: FastifyInstance
let originalSecret: string | undefined
let originalSiteKey: string | undefined
let originalHostnames: string | undefined
let fetchMock: ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(() => {
  originalSecret = env.TURNSTILE_SECRET_KEY
  originalSiteKey = env.TURNSTILE_SITEKEY
  originalHostnames = env.TURNSTILE_ALLOWED_HOSTNAMES

  fetchMock = vi.fn(async () => json({ success: true, hostname: 'calendar-slots-app.onrender.com' }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  env.TURNSTILE_SECRET_KEY = originalSecret
  env.TURNSTILE_SITEKEY = originalSiteKey
  env.TURNSTILE_ALLOWED_HOSTNAMES = originalHostnames
  vi.unstubAllGlobals()
})

const enableCaptcha = () => {
  env.TURNSTILE_SECRET_KEY = REAL_SECRET
  env.TURNSTILE_SITEKEY = SITE_KEY
}

type Slot = { id: number; startAt: string; durationMin: number; available: boolean }

async function freeSlot(): Promise<Slot> {
  const day = (await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })).json<{
    slots: Slot[]
  }>()

  const slot = day.slots.find((item) => item.available)
  if (!slot) {
    throw new Error('нет свободных слотов')
  }
  return slot
}

const payload = (slot: Slot, captchaToken?: string) => ({
  eventTypeId: 'default-consultation',
  startAt: slot.startAt,
  clientName: 'Иван',
  clientEmail: 'captcha@example.com',
  consentAccepted: true,
  ...(captchaToken ? { captchaToken } : {}),
})

describe('CAPTCHA выключена по умолчанию (dev/test/e2e)', () => {
  it('GET settings сообщает required=false и siteKey=null', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/default/settings' })

    expect(response.statusCode).toBe(200)
    expect(response.json().captcha).toEqual({
      provider: 'turnstile',
      required: false,
      siteKey: null,
    })
  })

  it('бронь создаётся без токена и без обращения к Cloudflare', async () => {
    const slot = await freeSlot()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot),
    })

    expect(response.statusCode).toBe(201)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('CAPTCHA включена (задан TURNSTILE_SECRET_KEY)', () => {
  it('GET settings отдаёт site key', async () => {
    enableCaptcha()

    const response = await app.inject({ method: 'GET', url: '/api/v1/hosts/default/settings' })

    expect(response.json().captcha).toEqual({
      provider: 'turnstile',
      required: true,
      siteKey: SITE_KEY,
    })
  })

  it('без токена отдаёт 422 CAPTCHA_FAILED и не ходит в Cloudflare', async () => {
    enableCaptcha()
    const slot = await freeSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot),
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('CAPTCHA_FAILED')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('с валидным токеном создаёт бронь и передаёт remoteip', async () => {
    enableCaptcha()
    const slot = await freeSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'good-token'),
    })

    expect(response.statusCode).toBe(201)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const body = new URLSearchParams(fetchMock.mock.calls[0][1].body)
    expect(body.get('secret')).toBe(REAL_SECRET)
    expect(body.get('response')).toBe('good-token')
    expect(body.get('remoteip')).toBeTruthy()
  })

  it('отказ Cloudflare (success:false) отдаёт 422 CAPTCHA_FAILED', async () => {
    enableCaptcha()
    fetchMock.mockResolvedValueOnce(json({ success: false, 'error-codes': ['invalid-input-response'] }))
    const slot = await freeSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'bad-token'),
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('CAPTCHA_FAILED')
  })

  it('недоступность Cloudflare не пропускает бронь (fail-closed)', async () => {
    enableCaptcha()
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const slot = await freeSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'some-token'),
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('CAPTCHA_FAILED')
  })

  it('ошибка HTTP от Cloudflare не пропускает бронь', async () => {
    enableCaptcha()
    fetchMock.mockResolvedValueOnce(json({ error: 'boom' }, 500))
    const slot = await freeSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'some-token'),
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('CAPTCHA_FAILED')
  })

  it('отклоняет токен, выданный для чужого домена', async () => {
    enableCaptcha()
    env.TURNSTILE_ALLOWED_HOSTNAMES = 'calendar-slots-app.onrender.com'
    fetchMock.mockResolvedValueOnce(json({ success: true, hostname: 'phishing.example' }))
    const slot = await freeSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      payload: payload(slot, 'token'),
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('CAPTCHA_FAILED')
  })

  it('реплей по Idempotency-Key не требует повторной проверки токена', async () => {
    enableCaptcha()
    const slot = await freeSlot()
    const headers = { 'idempotency-key': 'captcha-replay-1' }

    const first = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      headers,
      payload: payload(slot, 'good-token'),
    })
    expect(first.statusCode).toBe(201)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Токен одноразовый и уже израсходован — второй запрос с тем же токеном
    // обязан вернуть ту же бронь, а не CAPTCHA_FAILED.
    const second = await app.inject({
      method: 'POST',
      url: '/api/v1/hosts/default/bookings',
      headers,
      payload: payload(slot, 'good-token'),
    })

    expect(second.statusCode).toBe(201)
    expect(second.json().id).toBe(first.json().id)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('легаси POST /api/bookings тоже защищён (обход закрыт)', async () => {
    enableCaptcha()
    const slot = await freeSlot()

    const response = await app.inject({
      method: 'POST',
      url: '/api/bookings',
      payload: {
        slotId: slot.id,
        name: 'Иван',
        email: 'legacy@example.com',
        consentAccepted: true,
      },
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('CAPTCHA_FAILED')
  })
})
