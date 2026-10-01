import { eq } from 'drizzle-orm'

import type { BookingRow } from './bookings-v1'
import { db } from './db'
import { hosts } from './db/schema'
import { appOrigin, isEmailEnabled, sendEmail } from './email'
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
const safely = async (send: () => Promise<unknown>): Promise<void> => {
  try {
    await send()
  } catch {
    // провайдер недоступен — бронь всё равно успешна
  }
}

export async function notifyBookingConfirmed(booking: BookingRow): Promise<void> {
  if (!isEmailEnabled()) {
    return
  }

  const data = await buildEmailData(booking)

  await safely(async () => {
    await sendEmail(bookingConfirmedEmail(data))

    if (env.ORGANIZER_EMAIL) {
      await sendEmail(organizerNewBookingEmail(data, env.ORGANIZER_EMAIL))
    }
  })
}

export async function notifyBookingRescheduled(booking: BookingRow): Promise<void> {
  if (!isEmailEnabled()) {
    return
  }

  const data = await buildEmailData(booking)

  await safely(() => sendEmail(bookingRescheduledEmail(data)))
}

export async function notifyBookingCancelled(booking: BookingRow, reason?: string): Promise<void> {
  if (!isEmailEnabled()) {
    return
  }

  const data = await buildEmailData(booking)

  await safely(async () => {
    await sendEmail(bookingCancelledEmail(data, reason))

    if (env.ORGANIZER_EMAIL) {
      await sendEmail(organizerCancelledEmail(data, env.ORGANIZER_EMAIL, reason))
    }
  })
}

export async function notifyBookingReminder(booking: BookingRow): Promise<void> {
  if (!isEmailEnabled()) {
    return
  }

  const data = await buildEmailData(booking)

  await safely(() => sendEmail(bookingReminderEmail(data)))
}
