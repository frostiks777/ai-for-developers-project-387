import { eq } from 'drizzle-orm'

import type { BookingRow } from './bookings-v1'
import { db } from './db'
import { hosts } from './db/schema'
import { appOrigin, isEmailEnabled, sendEmail, type EmailMessage } from './email'
import {
  bookingCancelledEmail,
  bookingConfirmedEmail,
  bookingReminderEmail,
  bookingRescheduledEmail,
  organizerCancelledEmail,
  organizerNewBookingEmail,
  type BookingEmailData,
} from './email-templates'
import { env } from './env'
import { findEventTypeById } from './event-types'

// Логгер ставится из buildApp(). Модуль живёт дольше одного запроса, а
// передавать логгер в каждое уведомление значило бы трогать все точки вызова;
// раньше результат отправки не попадал в логи вовсе (#43).
type EmailLogger = { info: (message: string) => void; warn: (message: string) => void }

let emailLogger: EmailLogger | undefined

export const setEmailLogger = (logger: EmailLogger): void => {
  emailLogger = logger
}

const findHostById = async (id: string) =>
  (await db.select().from(hosts).where(eq(hosts.id, id)).limit(1))[0]

const parseGuests = (value: string | null): string[] | undefined => {
  if (!value) {
    return undefined
  }

  try {
    const parsed: unknown = JSON.parse(value)

    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')
      ? parsed
      : undefined
  } catch {
    return undefined
  }
}

async function buildEmailData(booking: BookingRow): Promise<BookingEmailData> {
  const host = await findHostById(booking.hostId)
  const eventType = await findEventTypeById(booking.eventTypeId)

  return {
    origin: appOrigin(),
    eventTypeTitle: eventType?.title ?? 'Встреча',
    hostName: host?.name ?? 'Организатор',
    timeZone: host?.timezone ?? 'UTC',
    clientName: booking.name,
    clientEmail: booking.email,
    startAt: booking.startAt,
    endAt: booking.endAt,
    bookingId: booking.cancelToken ?? '',
    guests: parseGuests(booking.guests),
  }
}

// Письмо не должно ломать основной сценарий: ошибки провайдера гасим.
// Но гасим не молча — результат каждой отправки попадает в лог (#43).
// Адреса в лог не пишем: это персональные данные гостей.
const safely = async (send: () => Promise<unknown>): Promise<void> => {
  try {
    await send()
  } catch (error) {
    emailLogger?.warn(
      `Письмо не отправлено: ${error instanceof Error ? error.message : 'неизвестная ошибка'}`,
    )
  }
}

// Отправляет письмо и фиксирует результат. «Принято провайдером» и «доставлено
// адресату» — разные вещи: Brevo отвечает 201 и на непригодного отправителя,
// поэтому в логе это формулируется именно как «принято».
const deliver = async (kind: string, message: EmailMessage): Promise<void> => {
  const result = await sendEmail(message)

  if (!result.ok) {
    emailLogger?.warn(`Письмо «${kind}» не принято провайдером: ${result.error}`)

    return
  }

  emailLogger?.info(
    result.skipped
      ? `Письмо «${kind}» пропущено: отправка выключена`
      : `Письмо «${kind}» принято провайдером (доставка адресату не гарантирована)`,
  )
}

export async function notifyBookingConfirmed(booking: BookingRow): Promise<void> {
  if (!isEmailEnabled()) {
    return
  }

  const data = await buildEmailData(booking)

  await safely(async () => {
    await deliver('подтверждение брони (гостю)', bookingConfirmedEmail(data))

    if (env.ORGANIZER_EMAIL) {
      await deliver(
        'новая бронь (организатору)',
        organizerNewBookingEmail(data, env.ORGANIZER_EMAIL),
      )
    }
  })
}

export async function notifyBookingRescheduled(booking: BookingRow): Promise<void> {
  if (!isEmailEnabled()) {
    return
  }

  const data = await buildEmailData(booking)

  await safely(() => deliver('перенос встречи (гостю)', bookingRescheduledEmail(data)))
}

export async function notifyBookingCancelled(booking: BookingRow, reason?: string): Promise<void> {
  if (!isEmailEnabled()) {
    return
  }

  const data = await buildEmailData(booking)

  await safely(async () => {
    await deliver('отмена встречи (гостю)', bookingCancelledEmail(data, reason))

    if (env.ORGANIZER_EMAIL) {
      await deliver(
        'отмена встречи (организатору)',
        organizerCancelledEmail(data, env.ORGANIZER_EMAIL, reason),
      )
    }
  })
}

export async function notifyBookingReminder(booking: BookingRow): Promise<void> {
  if (!isEmailEnabled()) {
    return
  }

  const data = await buildEmailData(booking)

  await safely(() => deliver('напоминание (гостю)', bookingReminderEmail(data)))
}
