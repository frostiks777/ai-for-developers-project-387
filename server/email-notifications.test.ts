// @vitest-environment node
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'

import { buildApp } from './app'
import { db } from './db'
import { bookings, hosts } from './db/schema'
import { env } from './env'
import { sendDueReminders } from './reminders'

type Slot = { id: number; startAt: string; available: boolean }

interface EmailBody {
  to: { email: string }[]
  subject: string
  textContent: string
  htmlContent: string
}

let app: FastifyInstance
let fetchMock: ReturnType<typeof vi.fn>
let original: {
  key: string | undefined
  from: string | undefined
  replyTo: string | undefined
  organizer: string | undefined
  origin: string | undefined
  secret: string | undefined
}

const json = (body: unknown, status = 201) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const emailBodies = (): EmailBody[] =>
  (fetchMock.mock.calls as [string, { body: string }][]).map(
    ([, init]) => JSON.parse(init.body) as EmailBody,
  )

const toOf = (email: EmailBody): string => email.to[0].email

const freeSlots = async (): Promise<Slot[]> =>
  (
    await app.inject({ method: 'GET', url: '/api/v1/hosts/default/slots' })
  ).json<{ slots: Slot[] }>().slots

async function book(clientEmail = 'guest@example.com') {
  const slot = (await freeSlots()).find((item) => item.available)

  if (!slot) {
    throw new Error('нет свободных слотов')
  }

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/hosts/default/bookings',
    payload: {
      eventTypeId: 'default-consultation',
      startAt: slot.startAt,
      clientName: 'Гость',
      clientEmail,
      consentAccepted: true,
    },
  })

  return { response, slot }
}

beforeAll(async () => {
  app = await buildApp()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

beforeEach(() => {
  original = {
    key: env.EMAIL_API_KEY,
    from: env.EMAIL_FROM,
    replyTo: env.EMAIL_REPLY_TO,
    organizer: env.ORGANIZER_EMAIL,
    origin: env.APP_ORIGIN,
    secret: env.REMINDERS_SECRET,
  }

  env.EMAIL_API_KEY = 'test-key'
  env.EMAIL_FROM = 'Календарь звонков <sender@example.com>'
  env.EMAIL_REPLY_TO = 'host@example.com'
  env.ORGANIZER_EMAIL = 'org@example.com'
  env.APP_ORIGIN = 'https://app.example.com'
  env.REMINDERS_SECRET = undefined

  fetchMock = vi.fn(async () => json({ messageId: '1' }))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  env.EMAIL_API_KEY = original.key
  env.EMAIL_FROM = original.from
  env.EMAIL_REPLY_TO = original.replyTo
  env.ORGANIZER_EMAIL = original.organizer
  env.APP_ORIGIN = original.origin
  env.REMINDERS_SECRET = original.secret
  vi.unstubAllGlobals()
})

describe('письма по событиям брони', () => {
  it('создание шлёт подтверждение гостю и уведомление организатору', async () => {
    const { response } = await book()

    expect(response.statusCode).toBe(201)

    const emails = emailBodies()

    expect(
      emails.some((email) => toOf(email) === 'guest@example.com' && email.subject.includes('Вы записаны')),
    ).toBe(true)
    expect(
      emails.some((email) => toOf(email) === 'org@example.com' && email.subject.includes('Новая бронь')),
    ).toBe(true)
  })

  it('отмена шлёт письмо гостю с причиной', async () => {
    const { response } = await book()
    const booking = response.json<{ id: string }>()

    fetchMock.mockClear()

    await app.inject({
      method: 'POST',
      url: `/api/v1/bookings/${booking.id}/cancel`,
      payload: { reason: 'не смогу' },
    })

    const email = emailBodies().find((item) => toOf(item) === 'guest@example.com')

    expect(email?.subject).toContain('отменена')
    expect(email?.textContent).toContain('не смогу')
  })

  it('перенос шлёт письмо о новом времени', async () => {
    const { response, slot } = await book()
    const booking = response.json<{ id: string }>()
    const another = (await freeSlots()).find((item) => item.available && item.id !== slot.id)

    fetchMock.mockClear()

    await app.inject({
      method: 'POST',
      url: `/api/v1/bookings/${booking.id}/reschedule`,
      payload: { startAt: another?.startAt },
    })

    expect(emailBodies().some((email) => email.subject.includes('перенесена'))).toBe(true)
  })

  it('без EMAIL_API_KEY письма не отправляются', async () => {
    env.EMAIL_API_KEY = undefined

    await book()

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('напоминания (ADR-0026)', () => {
  it('ленивая проверка шлёт напоминание один раз', async () => {
    const slot = (await freeSlots()).find((item) => item.available)
    const host = (await db.select().from(hosts).where(eq(hosts.slug, 'default')).limit(1))[0]

    await db.insert(bookings).values({
      hostId: host.id,
      slotId: slot!.id,
      eventTypeId: 'default-consultation',
      name: 'Гость',
      email: 'remind@example.com',
      status: 'confirmed',
      startAt: new Date(Date.now() + 60 * 60_000).toISOString(),
      endAt: new Date(Date.now() + 90 * 60_000).toISOString(),
      cancelToken: randomUUID(),
    })

    expect(await sendDueReminders()).toBeGreaterThanOrEqual(1)
    expect(
      emailBodies().some(
        (email) => toOf(email) === 'remind@example.com' && email.subject.includes('Напоминание'),
      ),
    ).toBe(true)

    const reminder = (
      await db.select().from(bookings).where(eq(bookings.email, 'remind@example.com')).limit(1)
    )[0]

    expect(reminder.reminderSentAt).not.toBeNull()
    expect(await sendDueReminders()).toBe(0)
  })

  it('endpoint напоминаний закрыт секретом', async () => {
    env.REMINDERS_SECRET = 'top-secret'

    expect((await app.inject({ method: 'POST', url: '/api/internal/reminders' })).statusCode).toBe(401)
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/internal/reminders',
          headers: { 'x-reminders-secret': 'nope' },
        })
      ).statusCode,
    ).toBe(401)

    const response = await app.inject({
      method: 'POST',
      url: '/api/internal/reminders',
      headers: { 'x-reminders-secret': 'top-secret' },
    })

    expect(response.statusCode).toBe(200)
    expect(typeof response.json<{ sent: number }>().sent).toBe('number')
  })

  it('принимает произвольный Content-Type от внешнего cron', async () => {
    env.REMINDERS_SECRET = 'top-secret'

    for (const contentType of ['application/x-www-form-urlencoded', 'text/plain']) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/internal/reminders',
        headers: { 'x-reminders-secret': 'top-secret', 'content-type': contentType },
      })

      expect(response.statusCode).toBe(200)
    }
  })

  it('без REMINDERS_SECRET endpoint выключен', async () => {
    env.REMINDERS_SECRET = undefined

    expect((await app.inject({ method: 'POST', url: '/api/internal/reminders' })).statusCode).toBe(404)
  })
})
