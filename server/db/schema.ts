import { sql } from 'drizzle-orm'
import { boolean, integer, pgTable, serial, text, uniqueIndex } from 'drizzle-orm/pg-core'

// Слоты материализуются из правил доступности (ADR-0003/0004); принадлежат хосту (ADR-0018)
export const slots = pgTable('slots', {
  id: serial('id').primaryKey(),
  hostId: text('hostId')
    .notNull()
    .references(() => hosts.id),
  // Дата-время начала слота в формате ISO 8601 (UTC)
  startAt: text('startAt').notNull(),
  durationMin: integer('durationMin').notNull().default(30),
})

// Дефолтный тип встречи, на который ссылаются брони без явного типа (MVP: один тип)
export const DEFAULT_EVENT_TYPE_ID = 'default-consultation'

// Типы встреч организатора (ADR-0011)
export const eventTypes = pgTable(
  'event_types',
  {
    id: text('id').primaryKey(),
    hostId: text('hostId')
      .notNull()
      .references(() => hosts.id),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    durationMin: integer('durationMin').notNull().default(30),
    locationType: text('locationType').notNull().default('online'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: text('createdAt')
      .notNull()
      .default(sql`(now()::text)`),
  },
  (table) => [uniqueIndex('event_types_host_slug_unique').on(table.hostId, table.slug)],
)

// Бронирования
export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  hostId: text('hostId')
    .notNull()
    .references(() => hosts.id),
  slotId: integer('slotId')
    .notNull()
    .references(() => slots.id),
  eventTypeId: text('eventTypeId')
    .notNull()
    .default(DEFAULT_EVENT_TYPE_ID)
    .references(() => eventTypes.id),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email').notNull(),
  comment: text('comment'),
  // Приглашённые участники — JSON-массив email (nullable)
  guests: text('guests'),
  // Согласие на обработку персональных данных
  consentAccepted: boolean('consentAccepted').notNull().default(false),
  // Ключ идемпотентности создания брони (защита от повторной отправки)
  idempotencyKey: text('idempotencyKey').unique(),
  // Статус брони: активная занимает слот, отменённая — нет (ADR-0011)
  status: text('status').notNull().default('confirmed'),
  // Причина отмены, если бронь отменена (гостем или организатором)
  cancellationReason: text('cancellationReason'),
  // Снимок времени встречи на момент бронирования (UTC ISO)
  startAt: text('startAt').notNull(),
  endAt: text('endAt').notNull(),
  // Токен для публичной ссылки отмены брони (в ответе на создание брони)
  cancelToken: text('cancelToken').unique(),
  // Когда отправлено напоминание (UTC ISO); null — ещё не отправляли (ADR-0026)
  reminderSentAt: text('reminderSentAt'),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(now()::text)`),
})

// Правила доступности организатора — одна строка на хоста (ADR-0018)
export const availabilityRules = pgTable(
  'availability_rules',
  {
    hostId: text('hostId')
      .notNull()
      .references(() => hosts.id),
    // Дни недели из JS (0 - вс .. 6 - сб), JSON-массив
    weekdays: text('weekdays').notNull(),
    windowStartHour: integer('windowStartHour').notNull(),
    windowEndHour: integer('windowEndHour').notNull(),
    slotDurationMin: integer('slotDurationMin').notNull(),
    bufferBeforeMin: integer('bufferBeforeMin').notNull().default(0),
    bufferAfterMin: integer('bufferAfterMin').notNull().default(0),
    minNoticeMin: integer('minNoticeMin').notNull(),
    horizonDays: integer('horizonDays').notNull(),
  },
  (table) => [uniqueIndex('availability_rules_hostId_unique').on(table.hostId)],
)

// Диапазоны доступности по дням недели: несколько интервалов на день (ADR-0011)
export const availabilityRanges = pgTable('availability_ranges', {
  id: serial('id').primaryKey(),
  hostId: text('hostId')
    .notNull()
    .references(() => hosts.id),
  // День недели: 1 - понедельник .. 7 - воскресенье
  weekday: integer('weekday').notNull(),
  // Минуты от полуночи в поясе хоста
  startMinute: integer('startMinute').notNull(),
  endMinute: integer('endMinute').notNull(),
})

// Хосты (мульти-хост). MVP использует дефолтного организатора
export const hosts = pgTable('hosts', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  timezone: text('timezone').notNull().default('UTC'),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(now()::text)`),
})

// Ручные блокировки времени: отпуск, личные дела (слоты внутри не выдаются)
export const timeBlocks = pgTable('time_blocks', {
  id: serial('id').primaryKey(),
  hostId: text('hostId')
    .notNull()
    .references(() => hosts.id),
  // Начало и конец блокировки (UTC ISO 8601)
  startAt: text('startAt').notNull(),
  endAt: text('endAt').notNull(),
  reason: text('reason'),
  createdAt: text('createdAt')
    .notNull()
    .default(sql`(now()::text)`),
})
