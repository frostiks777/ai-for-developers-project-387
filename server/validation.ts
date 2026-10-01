import { z } from 'zod'

const phonePattern = /^\+?[\d\s()-]+$/

// Телефон (необязательный): только цифры и разделители, 10–15 цифр (E.164)
function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return phonePattern.test(value) && digits.length >= 10 && digits.length <= 15
}

// Схема API-контракта, зеркалится фронтендом (src/lib/validation.ts) — менять только согласованно
export const createBookingSchema = z.object({
  slotId: z.int().positive('Некорректный слот'),
  name: z.string().trim().min(2, 'Имя от 2 символов'),
  phone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || isValidPhone(value), 'Неверный номер телефона'),
  email: z.string().trim().pipe(z.email('Неверный email')),
  comment: z
    .string()
    .trim()
    .max(500, 'Комментарий слишком длинный')
    .optional()
    .transform((value) => value || undefined),
  guests: z
    .array(z.string().trim().pipe(z.email('Неверный email гостя')))
    .max(20, 'Слишком много гостей')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  consentAccepted: z.boolean().optional(),
  // Легаси-эндпоинт POST /api/bookings тоже проверяет капчу, иначе он был бы
  // обходом защиты v1-маршрута (ADR-0025).
  captchaToken: z.string().trim().min(1).optional(),
})

// Правила доступности организатора (одна строка, см. server/rules.ts)
export const availabilityRulesSchema = z
  .object({
    weekdays: z.array(z.int().min(0).max(6)).min(1, 'Выберите хотя бы один рабочий день'),
    windowStartHour: z.int().min(0, 'Начало не раньше 0:00').max(23, 'Начало не позже 23:00'),
    windowEndHour: z.int().min(1, 'Конец не раньше 1:00').max(24, 'Конец не позже 24:00'),
    slotDurationMin: z.int().min(5, 'Слот не короче 5 минут').max(480, 'Слот не длиннее 8 часов'),
    bufferBeforeMin: z.int().min(0, 'Буфер не может быть отрицательным').max(480, 'Буфер не длиннее 8 часов'),
    bufferAfterMin: z.int().min(0, 'Буфер не может быть отрицательным').max(480, 'Буфер не длиннее 8 часов'),
    minNoticeMin: z.int().min(0).max(10080, 'Не больше недели'),
    horizonDays: z.int().min(1, 'Горизонт не меньше дня').max(90, 'Горизонт не больше 90 дней'),
  })
  .refine((rules) => rules.windowEndHour > rules.windowStartHour, {
    message: 'Конец окна должен быть позже начала',
    path: ['windowEndHour'],
  })

// Отмена брони по токену из ссылки (только сервер, зеркала на фронте нет)
export const cancelBookingSchema = z.object({
  token: z.string().trim().min(1, 'Укажите токен отмены'),
})

// Перенос брони на другой слот по токену
export const rescheduleBookingSchema = z.object({
  token: z.string().trim().min(1, 'Укажите токен брони'),
  slotId: z.int().positive('Некорректный слот'),
})

// Типы встреч организатора (ADR-0011)
export const locationTypeSchema = z.enum(['online', 'offline', 'phone'])

const eventTypeSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createEventTypeSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Укажите slug')
    .max(50, 'Slug слишком длинный')
    .regex(eventTypeSlugPattern, 'Slug: строчные латинские буквы, цифры и дефис'),
  title: z.string().trim().min(1, 'Укажите название').max(120, 'Название слишком длинное'),
  description: z
    .string()
    .trim()
    .max(500, 'Описание слишком длинное')
    .optional()
    .transform((value) => value || undefined),
  durationMin: z.int().min(15, 'Не короче 15 минут').max(480, 'Не длиннее 8 часов'),
  locationType: locationTypeSchema,
  isActive: z.boolean().optional(),
})

export const updateEventTypeSchema = z.object({
  title: z.string().trim().min(1, 'Укажите название').max(120, 'Название слишком длинное').optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Описание слишком длинное')
    .optional()
    .transform((value) => (value === undefined ? undefined : value || null)),
  durationMin: z.int().min(15, 'Не короче 15 минут').max(480, 'Не длиннее 8 часов').optional(),
  locationType: locationTypeSchema.optional(),
  isActive: z.boolean().optional(),
})

// Настройки доступности v1: диапазоны по дням недели (ADR-0011)
export const availabilityRangeSchema = z
  .object({
    weekday: z.int().min(1, 'День недели 1–7').max(7, 'День недели 1–7'),
    startMinute: z.int().min(0, 'Начало не раньше 0:00').max(1439, 'Начало до 23:59'),
    endMinute: z.int().min(1, 'Конец не раньше 0:01').max(1440, 'Конец до 24:00'),
  })
  .refine((range) => range.endMinute > range.startMinute, {
    message: 'Конец интервала должен быть позже начала',
    path: ['endMinute'],
  })

export const availabilitySettingsSchema = z.object({
  timeZone: z.string().trim().min(1, 'Укажите часовой пояс'),
  slotDurationMin: z.int().min(5, 'Слот не короче 5 минут').max(480, 'Слот не длиннее 8 часов'),
  bufferBeforeMin: z.int().min(0, 'Буфер не может быть отрицательным').max(480, 'Буфер не длиннее 8 часов'),
  bufferAfterMin: z.int().min(0, 'Буфер не может быть отрицательным').max(480, 'Буфер не длиннее 8 часов'),
  minNoticeMin: z.int().min(0).max(10080, 'Не больше недели'),
  horizonDays: z.int().min(1, 'Горизонт не меньше дня').max(90, 'Горизонт не больше 90 дней'),
  ranges: z.array(availabilityRangeSchema).min(1, 'Добавьте хотя бы один интервал'),
})
// Бронирование v1 (гость): тип встречи + время начала
export const v1CreateBookingSchema = z.object({
  eventTypeId: z.string().trim().min(1, 'Укажите тип встречи'),
  startAt: z.string().trim().min(1, 'Укажите время'),
  clientName: z.string().trim().min(2, 'Имя от 2 символов'),
  clientEmail: z.string().trim().pipe(z.email('Неверный email')),
  clientPhone: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => value === undefined || isValidPhone(value), 'Неверный номер телефона'),
  clientNotes: z
    .string()
    .trim()
    .max(500, 'Комментарий слишком длинный')
    .optional()
    .transform((value) => value || undefined),
  guests: z
    .array(z.string().trim().pipe(z.email('Неверный email гостя')))
    .max(20, 'Слишком много гостей')
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  consentAccepted: z
    .boolean()
    .refine((value) => value === true, 'Нужно согласие на обработку персональных данных'),
  // Одноразовый токен Cloudflare Turnstile (ADR-0025). Обязателен по факту,
  // когда на сервере задан TURNSTILE_SECRET_KEY; в схеме остаётся optional,
  // чтобы выключенная капча не ломала текущие вызовы.
  captchaToken: z.string().trim().min(1).optional(),
})

export const v1RescheduleBookingSchema = z.object({
  startAt: z.string().trim().min(1, 'Укажите время'),
})

// Отмена брони v1 с необязательной причиной (только сервер)
export const v1CancelBookingSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(500, 'Причина слишком длинная')
    .optional()
    .transform((value) => value || undefined),
})

// Создание хоста (мульти-хост, ADR-0018). Только сервер.
const hostSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createHostSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Укажите slug')
    .max(60, 'Slug слишком длинный')
    .regex(hostSlugPattern, 'Slug: строчные латинские буквы, цифры и дефис'),
  name: z.string().trim().min(1, 'Укажите имя').max(120, 'Имя слишком длинное'),
  timezone: z.string().trim().min(1, 'Укажите часовой пояс').optional(),
})

// Блокировка времени v1: интервал + необязательная причина
export const createTimeBlockSchema = z
  .object({
    startAt: z.string().trim().min(1, 'Укажите начало'),
    endAt: z.string().trim().min(1, 'Укажите конец'),
    reason: z
      .string()
      .trim()
      .max(500, 'Причина слишком длинная')
      .optional()
      .transform((value) => value || undefined),
  })
  .refine((block) => !Number.isNaN(Date.parse(block.startAt)), {
    message: 'Неверный формат начала',
    path: ['startAt'],
  })
  .refine((block) => !Number.isNaN(Date.parse(block.endAt)), {
    message: 'Неверный формат конца',
    path: ['endAt'],
  })
  .refine((block) => Date.parse(block.endAt) > Date.parse(block.startAt), {
    message: 'Конец должен быть позже начала',
    path: ['endAt'],
  })
