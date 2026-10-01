import { existsSync } from 'node:fs'
import { randomUUID, timingSafeEqual } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fastifyStatic from '@fastify/static'
import rateLimit from '@fastify/rate-limit'
import { and, eq, gte, lte, or } from 'drizzle-orm'
import Fastify, { type FastifyInstance } from 'fastify'
import { db } from './db'
import { captchaSiteKey, isCaptchaEnabled, verifyCaptchaToken } from './captcha'
import { env } from './env'
import { bookings, eventTypes, hosts, slots } from './db/schema'
import {
  cancelBookingV1,
  createBookingV1,
  findActiveBookingForSlot,
  findBookingByIdempotencyKey,
  findBookingByPublicId,
  findOtherActiveBooking,
  findSlotByStartAt,
  rescheduleBookingV1,
} from './bookings-v1'
import { isEmailEnabled } from './email'
import {
  notifyBookingCancelled,
  notifyBookingConfirmed,
  notifyBookingRescheduled,
} from './notifications'
import { scheduleLazyReminderCheck, sendDueReminders } from './reminders'
import { loadAvailabilitySettings, saveAvailabilitySettings } from './availability-settings'
import { conflictsWithBuffers, defaultAvailabilityRules } from './availability'
import {
  createEventType,
  deleteEventType,
  findEventType,
  findEventTypeById,
  listEventTypes,
  updateEventType,
} from './event-types'
import { dateKeyInZone, dateKeyPattern, isValidTimeZone } from './hosts'
import { loadAvailabilityRules, regenerateFutureSlots, saveAvailabilityRules } from './rules'
import {
  bookingRateLimit,
  clientIpKey,
  globalRateLimit,
  mutationRateLimit,
  publicReadRateLimit,
  rateLimitErrorResponse,
} from './rate-limit'
import {
  createTimeBlock,
  deleteTimeBlock,
  isBlocked,
  listBlockIntervals,
  listTimeBlocks,
} from './time-blocks'
import type { BookingWithSlot, TimeSlot } from './types'
import {
  availabilityRulesSchema,
  availabilitySettingsSchema,
  cancelBookingSchema,
  createBookingSchema,
  createEventTypeSchema,
  createHostSchema,
  createTimeBlockSchema,
  rescheduleBookingSchema,
  updateEventTypeSchema,
  v1CancelBookingSchema,
  v1CreateBookingSchema,
  v1RescheduleBookingSchema,
} from './validation'

// Единый набор колонок для выборок «бронь + данные слота»
const bookingWithSlotColumns = {
  id: bookings.id,
  slotId: bookings.slotId,
  name: bookings.name,
  phone: bookings.phone,
  email: bookings.email,
  comment: bookings.comment,
  status: bookings.status,
  cancelToken: bookings.cancelToken,
  eventTypeId: bookings.eventTypeId,
  eventTypeTitle: eventTypes.title,
  createdAt: bookings.createdAt,
  startAt: slots.startAt,
  durationMin: slots.durationMin,
}

// Код нарушения уникального индекса в PostgreSQL
const PG_UNIQUE_VIOLATION = '23505'

// Drizzle оборачивает ошибки драйвера в DrizzleQueryError с полем cause,
// поэтому код ошибки Postgres ищем по цепочке cause.
function pgErrorCode(error: unknown): string | undefined {
  let current: unknown = error

  for (let depth = 0; depth < 5 && current; depth += 1) {
    const code = (current as { code?: string }).code
    if (code) return code
    current = (current as { cause?: unknown }).cause
  }

  return undefined
}

const isUniqueViolation = (error: unknown) => pgErrorCode(error) === PG_UNIQUE_VIOLATION

// Фабрика приложения: тесты создают изолированный инстанс без listen()
export async function buildApp(): Promise<FastifyInstance> {
  // В тестах логи fastify не нужны (vitest выставляет NODE_ENV=test)
  // trustProxy обязателен для rate-limit по IP: без него request.ip у всех
  // гостей одинаков (адрес прокси), и лимит превращается в глобальный (ADR-0025).
  // Подробности про CF-Connecting-IP и почему не подбираем число хопов —
  // в server/rate-limit.ts (clientIpKey).
  const app = Fastify({
    logger: process.env.NODE_ENV !== 'test',
    trustProxy: true,
  })

  // Лимиты задаются на конкретных маршрутах (global: false), кроме общего
  // предохранителя, который нужен на всех путях, включая несуществующие.
  await app.register(rateLimit, {
    global: false,
    max: globalRateLimit().max,
    timeWindow: globalRateLimit().timeWindow,
    keyGenerator: clientIpKey,
    errorResponseBuilder: rateLimitErrorResponse,
  })

  // Панель организатора и административные API доступны без логина: в проекте
  // один заранее заданный владелец, авторизация по спецификации курса не нужна
  // (ADR-0028). Гейт Basic-auth (ADR-0017/0022) удалён.

  // Ленивая проверка напоминаний (ADR-0026): дёшево и с троттлингом,
  // в тестах выключена, чтобы фоновые отправки не примешивались к мокам fetch.
  app.addHook('onRequest', async () => {
    scheduleLazyReminderCheck()
  })


  const minNoticeMs = async (hostId: string) =>
    (await loadAvailabilityRules(hostId)).minNoticeMin * 60 * 1000

  // Окно записи хоста: [now + minNotice, now + horizonDays]. Границы задаются
  // здесь, а не только материализацией слотов, иначе горизонт держится лишь
  // тем, что слоты заранее созданы ровно на него (#97).
  const bookingWindow = async (hostId: string) => {
    const { minNoticeMin, horizonDays } = await loadAvailabilityRules(hostId)
    const now = Date.now()

    return {
      from: new Date(now + minNoticeMin * 60 * 1000).toISOString(),
      to: new Date(now + horizonDays * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  // Интервалы подтверждённых встреч хоста — для отсечения слотов, попавших
  // в буфер до/после занятой встречи (#89).
  const busyIntervals = async (hostId: string) => {
    const rules = await loadAvailabilityRules(hostId)
    const rows = await db
      .select({ startAt: bookings.startAt, endAt: bookings.endAt })
      .from(bookings)
      .where(and(eq(bookings.hostId, hostId), eq(bookings.status, 'confirmed')))

    return {
      intervals: rows.map((row) => ({ startAt: row.startAt, endAt: row.endAt })),
      bufferBeforeMin: rules.bufferBeforeMin,
      bufferAfterMin: rules.bufferAfterMin,
    }
  }

  // Читает хост по slug или UUID; undefined, если не найден (роуты отвечают 404)
  const findHost = async (ref: string) =>
    (
      await db
        .select()
        .from(hosts)
        .where(or(eq(hosts.slug, ref), eq(hosts.id, ref)))
        .limit(1)
    )[0]

  // MVP: единственный хост (дефолтный организатор)
  const defaultHost = async () => (await db.select().from(hosts).limit(1))[0]

  app.get('/health', () => ({ status: 'ok' }))

  // CAPTCHA выключена, пока не задан TURNSTILE_SECRET_KEY. В продакшене это
  // почти наверняка ошибка конфигурации — предупреждаем громко, но не падаем
  // (тем же приёмом, что и для ADMIN_PASSWORD в ADR-0017).
  if (env.NODE_ENV === 'production' && !isCaptchaEnabled()) {
    app.log.warn(
      'CAPTCHA выключена: не задан TURNSTILE_SECRET_KEY. Публичная запись брони не защищена от ботов (ADR-0025).',
    )
  }

  if (env.NODE_ENV === 'production' && !isEmailEnabled()) {
    app.log.warn('Email-уведомления выключены: не задан EMAIL_API_KEY (ADR-0026).')
  }

  // Слоты хоста в будущем с признаком занятости, отсортированные по startAt.
  // Слоты, пересекающиеся с ручными блокировками или с буферами вокруг
  // подтверждённых встреч, не выдаются (#89).
  const selectFutureSlots = async (hostId: string): Promise<TimeSlot[]> => {
    const blocks = await listBlockIntervals(hostId)
    const busy = await busyIntervals(hostId)
    const window = await bookingWindow(hostId)

    const rows = await db
      .select({
        id: slots.id,
        startAt: slots.startAt,
        durationMin: slots.durationMin,
        bookingId: bookings.id,
      })
      .from(slots)
      .leftJoin(bookings, and(eq(bookings.slotId, slots.id), eq(bookings.status, 'confirmed')))
      .where(
        and(
          eq(slots.hostId, hostId),
          gte(slots.startAt, window.from),
          lte(slots.startAt, window.to),
        ),
      )
      .orderBy(slots.startAt)

    return rows
      .map((row) => ({
        id: row.id,
        startAt: row.startAt,
        durationMin: row.durationMin,
        isBooked: row.bookingId !== null,
      }))
      .filter((slot) => {
        const interval = {
          startAt: slot.startAt,
          endAt: new Date(
            new Date(slot.startAt).getTime() + slot.durationMin * 60_000,
          ).toISOString(),
        }

        if (isBlocked(interval, blocks)) {
          return false
        }

        if (slot.isBooked) {
          return true
        }

        return !conflictsWithBuffers(
          interval.startAt,
          interval.endAt,
          busy.intervals,
          busy.bufferBeforeMin,
          busy.bufferAfterMin,
        )
      })
  }

  app.get('/api/slots', async (): Promise<TimeSlot[]> => {
    const host = await defaultHost()

    return host ? selectFutureSlots(host.id) : []
  })

  // Список броней дефолтного хоста с данными слота (панель организатора), по времени начала
  app.get('/api/bookings', async (): Promise<BookingWithSlot[]> => {
    const host = await defaultHost()

    if (!host) {
      return []
    }

    return db
      .select(bookingWithSlotColumns)
      .from(bookings)
      .innerJoin(slots, eq(bookings.slotId, slots.id))
      .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
      .where(eq(bookings.hostId, host.id))
      .orderBy(slots.startAt)
  })

  app.post(
    '/api/bookings',
    { config: { rateLimit: bookingRateLimit() } },
    async (request, reply) => {
      const parsed = createBookingSchema.safeParse(request.body)

      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
        return reply.code(422).send({ error: message })
      }

      // Легаси-эндпоинт не входит в контракт v1, но остаётся публичным —
      // иначе он был бы очевидным обходом CAPTCHA (ADR-0025).
      const captcha = await verifyCaptchaToken(
        (request.body as { captchaToken?: string } | undefined)?.captchaToken,
        request.ip,
      )

      if (!captcha.ok) {
        return reply.code(422).send({ error: { code: 'CAPTCHA_FAILED', message: captcha.reason } })
      }

      const { slotId, name, phone, email, comment } = parsed.data

      const slotRows = await db.select().from(slots).where(eq(slots.id, slotId)).limit(1)
      const slot = slotRows[0]
      if (!slot) {
        return reply.code(404).send({ error: 'Слот не найден' })
      }

      if (slot.startAt < new Date().toISOString()) {
        return reply.code(400).send({ error: 'Слот уже прошёл' })
      }

      if (slot.startAt < new Date(Date.now() + (await minNoticeMs(slot.hostId))).toISOString()) {
        return reply.code(400).send({ error: 'Слот уже недоступен' })
      }

      try {
        const created = (
          await db
            .insert(bookings)
            .values({
              hostId: slot.hostId,
              slotId,
              name,
              phone: phone ?? null,
              email,
              comment: comment ?? null,
              cancelToken: randomUUID(),
              startAt: slot.startAt,
              endAt: new Date(
                new Date(slot.startAt).getTime() + slot.durationMin * 60_000,
              ).toISOString(),
            })
            .returning()
        )[0]

        return reply.code(201).send(created)
      } catch (error) {
        if (isUniqueViolation(error)) {
          return reply.code(409).send({ error: 'Слот уже занят' })
        }

        throw error
      }
    },
  )

  // Отмена брони организатором — слот снова становится свободным
  app.delete('/api/bookings/:id', async (request, reply) => {
    const id = Number((request.params as { id: string }).id)

    if (!Number.isInteger(id) || id <= 0) {
      return reply.code(400).send({ error: 'Некорректный id брони' })
    }

    const deleted = await db.delete(bookings).where(eq(bookings.id, id)).returning()

    if (deleted.length === 0) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return reply.code(204).send()
  })

  // Публичная отмена брони по токену из ссылки на экране успеха
  app.post(
    '/api/bookings/cancel',
    { config: { rateLimit: mutationRateLimit() } },
    async (request, reply) => {
    const parsed = cancelBookingSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Укажите токен отмены'
      return reply.code(422).send({ error: message })
    }

    const deleted = await db
      .delete(bookings)
      .where(eq(bookings.cancelToken, parsed.data.token))
      .returning()

    if (deleted.length === 0) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return reply.code(204).send()
  })

  // Бронь по токену (для страницы переноса): отдаёт текущее время слота
  app.get('/api/bookings/by-token/:token', async (request, reply) => {
    const { token } = request.params as { token: string }

    const booking = (
      await db
        .select(bookingWithSlotColumns)
        .from(bookings)
        .innerJoin(slots, eq(bookings.slotId, slots.id))
        .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .where(eq(bookings.cancelToken, token))
        .limit(1)
    )[0]

    if (!booking) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    return booking
  })

  // Перенос брони на другой слот по токену; старый слот освобождается
  app.post(
    '/api/bookings/reschedule',
    { config: { rateLimit: mutationRateLimit() } },
    async (request, reply) => {
    const parsed = rescheduleBookingSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидный запрос переноса'
      return reply.code(400).send({ error: message })
    }

    const { token, slotId } = parsed.data

    const booking = (
      await db.select().from(bookings).where(eq(bookings.cancelToken, token)).limit(1)
    )[0]
    if (!booking) {
      return reply.code(404).send({ error: 'Бронь не найдена' })
    }

    const slot = (await db.select().from(slots).where(eq(slots.id, slotId)).limit(1))[0]
    if (!slot) {
      return reply.code(404).send({ error: 'Слот не найден' })
    }

    if (slot.startAt < new Date().toISOString()) {
      return reply.code(400).send({ error: 'Слот уже прошёл' })
    }

    if (slot.startAt < new Date(Date.now() + (await minNoticeMs(booking.hostId))).toISOString()) {
      return reply.code(400).send({ error: 'Слот уже недоступен' })
    }

    if (booking.slotId !== slotId) {
      try {
        await db
          .update(bookings)
          .set({
            slotId,
            startAt: slot.startAt,
            endAt: new Date(
              new Date(slot.startAt).getTime() + slot.durationMin * 60_000,
            ).toISOString(),
          })
          .where(eq(bookings.id, booking.id))
      } catch (error) {
        if (isUniqueViolation(error)) {
          return reply.code(409).send({ error: 'Слот уже занят' })
        }

        throw error
      }
    }

    return (
      await db
        .select(bookingWithSlotColumns)
        .from(bookings)
        .innerJoin(slots, eq(bookings.slotId, slots.id))
        .leftJoin(eventTypes, eq(bookings.eventTypeId, eventTypes.id))
        .where(eq(bookings.id, booking.id))
        .limit(1)
    )[0]
  })

  // Текущие правила доступности организатора
  app.get('/api/availability', async () => {
    const host = await defaultHost()

    return host ? loadAvailabilityRules(host.id) : defaultAvailabilityRules
  })

  // Обновление правил: сохраняем и пересобираем будущие свободные слоты
  app.put('/api/availability', async (request, reply) => {
    const parsed = availabilityRulesSchema.safeParse(request.body)

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидные правила доступности'
      return reply.code(422).send({ error: message })
    }

    const host = await defaultHost()
    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    await saveAvailabilityRules(host.id, parsed.data)
    await regenerateFutureSlots(host.id, parsed.data)

    return loadAvailabilityRules(host.id)
  })

  // ── API v1: мульти-хост ──────────────────────────────────────────────
  // Формат ошибки контракта v1
  const v1Error = (code: string, message: string) => ({ error: { code, message } })

  // Публичное представление брони (id = cancelToken — UUID для ссылок отмены/переноса)
  const toBooking = (row: typeof bookings.$inferSelect, slug: string, timeZone: string) => ({
    id: row.cancelToken ?? '',
    hostSlug: slug,
    eventTypeId: row.eventTypeId,
    startAt: row.startAt,
    endAt: row.endAt,
    timeZone,
    status: row.status,
    clientName: row.name,
    clientEmail: row.email,
    clientPhone: row.phone,
    clientNotes: row.comment,
    clientGuests: row.guests ? (JSON.parse(row.guests) as string[]) : null,
    consentAccepted: row.consentAccepted,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt,
  })

  // ── API v1: хосты (мульти-хост, ADR-0018) ────────────────────────────
  const toHost = (host: typeof hosts.$inferSelect) => ({
    id: host.id,
    slug: host.slug,
    name: host.name,
    timeZone: host.timezone,
  })

  // Список хостов (админ-маршрут под Basic-auth)
  app.get('/api/v1/hosts', async () => {
    const rows = await db.select().from(hosts).orderBy(hosts.createdAt)

    return rows.map(toHost)
  })

  // Создание хоста
  app.post('/api/v1/hosts', async (request, reply) => {
    const parsed = createHostSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    const timezone = parsed.data.timezone ?? 'UTC'
    if (!isValidTimeZone(timezone)) {
      return reply.code(422).send(v1Error('VALIDATION_ERROR', 'Неверный часовой пояс'))
    }

    try {
      const created = (
        await db
          .insert(hosts)
          .values({
            id: randomUUID(),
            slug: parsed.data.slug,
            name: parsed.data.name,
            timezone,
          })
          .returning()
      )[0]

      // Новому хосту — стартовые правила расписания (ADR-0018) и тип встречи,
      // иначе гостю нечего бронировать (eventTypeId обязателен в v1).
      await saveAvailabilityRules(created.id, defaultAvailabilityRules)
      await createEventType(created.id, {
        slug: 'consultation',
        title: 'Звонок-консультация',
        durationMin: 30,
        locationType: 'online',
        isActive: true,
      })

      return reply.code(201).send(toHost(created))
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.code(409).send(v1Error('CONFLICT', 'Хост с таким slug уже существует'))
      }

      throw error
    }
  })

  // Публичные настройки хоста по контракту HostSettings
  app.get(
    '/api/v1/hosts/:slug/settings',
    { config: { rateLimit: publicReadRateLimit() } },
    async (request, reply) => {
      const { slug } = request.params as { slug: string }
      const host = await findHost(slug)

      if (!host) {
        return reply.code(404).send({ error: 'Хост не найден' })
      }

      const captchaRequired = isCaptchaEnabled()

      return {
        slug: host.slug,
        name: host.name,
        timeZone: host.timezone,
        // CAPTCHA выключена, пока не задан TURNSTILE_SECRET_KEY (ADR-0025).
        captcha: {
          provider: 'turnstile',
          required: captchaRequired,
          siteKey: captchaRequired ? captchaSiteKey() : null,
        },
      }
    },
  )

  // Слоты хоста; необязательные ?date=YYYY-MM-DD, ?timezone=IANA, ?eventTypeId=
  app.get(
    '/api/v1/hosts/:slug/slots',
    { config: { rateLimit: publicReadRateLimit() } },
    async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const { date, timezone, eventTypeId } = request.query as {
      date?: string
      timezone?: string
      eventTypeId?: string
    }
    const timeZone = timezone ?? host.timezone

    if (!isValidTimeZone(timeZone)) {
      return reply.code(400).send({ error: 'Неверный часовой пояс' })
    }

    if (date && !dateKeyPattern.test(date)) {
      return reply.code(400).send({ error: 'Неверный формат даты, ожидается YYYY-MM-DD' })
    }

    let durationMin = 30

    if (eventTypeId) {
      const eventType = await findEventType(host.id, eventTypeId)

      if (!eventType) {
        return reply.code(404).send({ error: 'Тип встречи не найден' })
      }

      durationMin = eventType.durationMin
    }

    const slots = (await selectFutureSlots(host.id))
      .filter((slot) => !date || dateKeyInZone(slot.startAt, timeZone) === date)
      .map((slot) => ({
        id: slot.id,
        startAt: slot.startAt,
        durationMin,
        available: !slot.isBooked,
      }))

    return { timeZone, date: date ?? null, slots }
    },
  )

  // ── API v1: диапазоны доступности ────────────────────────────────────
  app.get(
    '/api/v1/hosts/:slug/availability',
    { config: { rateLimit: publicReadRateLimit() } },
    async (request, reply) => {
      const { slug } = request.params as { slug: string }
      const host = await findHost(slug)

      if (!host) {
        return reply.code(404).send({ error: 'Хост не найден' })
      }

      return loadAvailabilitySettings(host.id, host.timezone)
    },
  )

  app.put('/api/v1/hosts/:slug/availability', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = availabilitySettingsSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидные настройки доступности'
      return reply.code(422).send({ error: message })
    }

    // Пояс правил хранится у хоста (ADR-0024): при изменении — сохраняем в hosts.timezone,
    // затем пересобираем будущие свободные слоты в новом поясе.
    const requestedZone = parsed.data.timeZone
    if (isValidTimeZone(requestedZone) && requestedZone !== host.timezone) {
      await db.update(hosts).set({ timezone: requestedZone }).where(eq(hosts.id, host.id))
    }

    await saveAvailabilitySettings(host.id, parsed.data)

    return loadAvailabilitySettings(host.id, requestedZone)
  })

  // ── API v1: типы встреч ──────────────────────────────────────────────
  app.get(
    '/api/v1/hosts/:slug/event-types',
    { config: { rateLimit: publicReadRateLimit() } },
    async (request, reply) => {
      const { slug } = request.params as { slug: string }
      const host = await findHost(slug)

      if (!host) {
        return reply.code(404).send({ error: 'Хост не найден' })
      }

      return listEventTypes(host.id)
    },
  )

  app.post('/api/v1/hosts/:slug/event-types', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = createEventTypeSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send({ error: message })
    }

    try {
      return reply.code(201).send(await createEventType(host.id, parsed.data))
    } catch (error) {
      if (isUniqueViolation(error)) {
        return reply.code(409).send({ error: 'Тип с таким slug уже существует' })
      }

      throw error
    }
  })

  app.patch('/api/v1/hosts/:slug/event-types/:eventTypeId', async (request, reply) => {
    const { slug, eventTypeId } = request.params as { slug: string; eventTypeId: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    const parsed = updateEventTypeSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send({ error: message })
    }

    const updated = await updateEventType(host.id, eventTypeId, parsed.data)
    if (!updated) {
      return reply.code(404).send({ error: 'Тип встречи не найден' })
    }

    return updated
  })

  app.delete('/api/v1/hosts/:slug/event-types/:eventTypeId', async (request, reply) => {
    const { slug, eventTypeId } = request.params as { slug: string; eventTypeId: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send({ error: 'Хост не найден' })
    }

    if (!(await deleteEventType(host.id, eventTypeId))) {
      return reply.code(404).send({ error: 'Тип встречи не найден' })
    }

    return reply.code(204).send()
  })

  // ── API v1: брони ────────────────────────────────────────────────────
  // Список броней закрыт Basic-auth (ADR-0022, см. requiresAdminAuth)
  app.get('/api/v1/hosts/:slug/bookings', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.hostId, host.id))
      .orderBy(bookings.startAt)

    return rows.map((row) => toBooking(row, host.slug, host.timezone))
  })

  app.post(
    '/api/v1/hosts/:slug/bookings',
    { config: { rateLimit: bookingRateLimit() } },
    async (request, reply) => {
      const { slug } = request.params as { slug: string }
      const host = await findHost(slug)

      if (!host) {
        return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
      }

      const idempotencyKey =
        typeof request.headers['idempotency-key'] === 'string'
          ? request.headers['idempotency-key']
          : undefined

      // Реплей по Idempotency-Key возвращаем до проверки CAPTCHA: токен одноразовый,
      // повторная верификация израсходованного токена вернула бы ложный отказ.
      if (idempotencyKey) {
        const existing = await findBookingByIdempotencyKey(idempotencyKey)

        if (existing) {
          return reply.code(201).send(toBooking(existing, host.slug, host.timezone))
        }
      }

      const parsed = v1CreateBookingSchema.safeParse(request.body)
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
        return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
      }

      // CAPTCHA проверяется после разбора тела, но до бизнес-логики слотов:
      // мусорный запрос не должен стоить сетевого вызова к Cloudflare (ADR-0025).
      const captcha = await verifyCaptchaToken(
        parsed.data.captchaToken,
        request.ip,
        idempotencyKey,
      )

      if (!captcha.ok) {
        return reply.code(422).send(v1Error('CAPTCHA_FAILED', captcha.reason))
      }

      const eventType = await findEventType(host.id, parsed.data.eventTypeId)
      if (!eventType) {
        return reply.code(404).send(v1Error('NOT_FOUND', 'Тип встречи не найден'))
      }

      if (Number.isNaN(Date.parse(parsed.data.startAt))) {
        return reply.code(422).send(v1Error('VALIDATION_ERROR', 'Неверный формат времени'))
      }

      const slot = await findSlotByStartAt(host.id, parsed.data.startAt)
      if (!slot) {
        return reply.code(404).send(v1Error('NOT_FOUND', 'Слот не найден'))
      }

      if (slot.startAt < new Date(Date.now() + (await minNoticeMs(host.id))).toISOString()) {
        return reply.code(409).send(v1Error('CONFLICT', 'Слот уже недоступен'))
      }

      if (await findActiveBookingForSlot(slot.id)) {
        return reply.code(409).send(v1Error('SLOT_TAKEN', 'Слот уже занят'))
      }

      const slotInterval = {
        startAt: slot.startAt,
        endAt: new Date(
          new Date(slot.startAt).getTime() + eventType.durationMin * 60_000,
        ).toISOString(),
      }

      if (isBlocked(slotInterval, await listBlockIntervals(host.id))) {
        return reply.code(409).send(v1Error('CONFLICT', 'Время заблокировано организатором'))
      }

      const busy = await busyIntervals(host.id)
      if (
        conflictsWithBuffers(
          slotInterval.startAt,
          slotInterval.endAt,
          busy.intervals,
          busy.bufferBeforeMin,
          busy.bufferAfterMin,
        )
      ) {
        return reply.code(409).send(v1Error('CONFLICT', 'Слот попадает в буфер соседней встречи'))
      }

      const created = await createBookingV1(
        host.id,
        { ...parsed.data, idempotencyKey },
        slot,
        eventType.durationMin,
      )

      await notifyBookingConfirmed(created)

      return reply.code(201).send(toBooking(created, host.slug, host.timezone))
    },
  )

  // ── API v1: блокировки времени ───────────────────────────────────────
  app.get('/api/v1/hosts/:slug/blocks', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    return listTimeBlocks(host.id)
  })

  app.post('/api/v1/hosts/:slug/blocks', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    const parsed = createTimeBlockSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    const created = await createTimeBlock(host.id, {
      startAt: new Date(parsed.data.startAt).toISOString(),
      endAt: new Date(parsed.data.endAt).toISOString(),
      reason: parsed.data.reason,
    })

    return reply.code(201).send(created)
  })

  app.delete('/api/v1/hosts/:slug/blocks/:blockId', async (request, reply) => {
    const { slug, blockId } = request.params as { slug: string; blockId: string }
    const host = await findHost(slug)

    if (!host) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Хост не найден'))
    }

    const id = Number(blockId)
    if (!Number.isInteger(id) || id <= 0) {
      return reply.code(400).send(v1Error('VALIDATION_ERROR', 'Некорректный id блокировки'))
    }

    if (!(await deleteTimeBlock(host.id, id))) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Блокировка не найдена'))
    }

    return reply.code(204).send()
  })

  app.get('/api/v1/bookings/:bookingId', async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = await findBookingByPublicId(bookingId)

    if (!booking) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Бронь не найдена'))
    }

    const host = await findHost(booking.hostId)

    return toBooking(booking, host?.slug ?? '', host?.timezone ?? 'UTC')
  })

  app.post(
    '/api/v1/bookings/:bookingId/cancel',
    { config: { rateLimit: mutationRateLimit() } },
    async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = await findBookingByPublicId(bookingId)

    if (!booking) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Бронь не найдена'))
    }

    const parsed = v1CancelBookingSchema.safeParse(request.body ?? {})
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидное тело запроса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    const host = await findHost(booking.hostId)

    if (booking.status === 'cancelled') {
      return toBooking(booking, host?.slug ?? '', host?.timezone ?? 'UTC')
    }

    const cancelled = await cancelBookingV1(booking, parsed.data.reason)
    await notifyBookingCancelled(cancelled, parsed.data.reason)

    return toBooking(cancelled, host?.slug ?? '', host?.timezone ?? 'UTC')
  })

  app.post(
    '/api/v1/bookings/:bookingId/reschedule',
    { config: { rateLimit: mutationRateLimit() } },
    async (request, reply) => {
    const { bookingId } = request.params as { bookingId: string }
    const booking = await findBookingByPublicId(bookingId)

    if (!booking) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Бронь не найдена'))
    }

    const parsed = v1RescheduleBookingSchema.safeParse(request.body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Невалидный запрос переноса'
      return reply.code(422).send(v1Error('VALIDATION_ERROR', message))
    }

    if (Number.isNaN(Date.parse(parsed.data.startAt))) {
      return reply.code(422).send(v1Error('VALIDATION_ERROR', 'Неверный формат времени'))
    }

    const slot = await findSlotByStartAt(booking.hostId, parsed.data.startAt)
    if (!slot) {
      return reply.code(404).send(v1Error('NOT_FOUND', 'Слот не найден'))
    }

    if (slot.startAt < new Date(Date.now() + (await minNoticeMs(booking.hostId))).toISOString()) {
      return reply.code(409).send(v1Error('CONFLICT', 'Слот уже недоступен'))
    }

    if (await findOtherActiveBooking(slot.id, booking.id)) {
      return reply.code(409).send(v1Error('SLOT_TAKEN', 'Слот уже занят'))
    }

    const eventType = await findEventTypeById(booking.eventTypeId)
    const durationMin = eventType?.durationMin ?? 30
    const host = await findHost(booking.hostId)

    const slotInterval = {
      startAt: slot.startAt,
      endAt: new Date(new Date(slot.startAt).getTime() + durationMin * 60_000).toISOString(),
    }

    if (host && isBlocked(slotInterval, await listBlockIntervals(host.id))) {
      return reply.code(409).send(v1Error('CONFLICT', 'Время заблокировано организатором'))
    }

    const updated = await rescheduleBookingV1(booking, slot, durationMin)
    await notifyBookingRescheduled(updated)

    return toBooking(updated, host?.slug ?? '', host?.timezone ?? 'UTC')
  })

  // Внешний cron (cron-job.org) дёргает этот endpoint на бесплатном Render,
  // где cron-сервисы платные, а in-process таймеры ненадёжны (ADR-0026).
  // Секрет не задан — endpoint выключен (404): публичного «отправителя писем» нет.
  await app.register(async (scope) => {
    // Cron шлёт POST без тела и с произвольным Content-Type; по умолчанию
    // Fastify принимает только json/text и отвечает 415. Тело здесь не нужно —
    // принимаем любой Content-Type (пустое тело тоже), в рамках этого плагина.
    scope.addContentTypeParser('*', { parseAs: 'string' }, (_request, body, done) => {
      done(null, body)
    })

    scope.post('/api/internal/reminders', async (request, reply) => {
      const secret = env.REMINDERS_SECRET

      if (!secret) {
        return reply.code(404).send()
      }

      const provided = request.headers['x-reminders-secret']
      const isValid =
        typeof provided === 'string' &&
        provided.length === secret.length &&
        timingSafeEqual(Buffer.from(provided), Buffer.from(secret))

      if (!isValid) {
        return reply.code(401).send({ error: 'Неверный секрет' })
      }

      return { sent: await sendDueReminders() }
    })
  })

  // /events перенесена в панель (ADR-0022). Редирект серверный, а не <Navigate>:
  // вход в панель возможен только полной навигацией, иначе браузер не спросит пароль.
  app.get('/events', (_request, reply) => reply.redirect('/admin/bookings', 302))

  // В продакшене Fastify отдаёт собранный Vite-фронтенд из dist/
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const distDir = path.resolve(currentDir, '..', 'dist')

  if (existsSync(distDir)) {
    await app.register(fastifyStatic, { root: distDir, prefix: '/' })

    // SPA fallback: любой GET вне /api отдаёт index.html
    app.setNotFoundHandler((request, reply) => {
      if (request.raw.method === 'GET' && !request.url.startsWith('/api')) {
        return reply.sendFile('index.html')
      }

      return reply.code(404).send({ error: 'Не найдено' })
    })
  }

  return app
}

