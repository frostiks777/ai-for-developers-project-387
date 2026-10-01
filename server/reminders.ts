import { and, eq, gt, isNull, lte } from 'drizzle-orm'

import { db } from './db'
import { bookings } from './db/schema'
import { env } from './env'
import { isEmailEnabled } from './email'
import { notifyBookingReminder } from './notifications'

// Ленивая проверка напоминаний (ADR-0026). In-process таймеры на Render Free
// ненадёжны (сон через 15 мин простоя, рестарты), поэтому due-письма
// выбираются из БД по запросу/старту и внешним cron (cron-job.org).
const LAZY_THROTTLE_MS = 5 * 60_000

let lastLazyCheckAt = 0

// Идемпотентно: письмо помечается отправленным ДО отправки, повторный вызов
// (в том числе параллельный) не продублирует напоминание.
export async function sendDueReminders(now = new Date()): Promise<number> {
  if (!isEmailEnabled()) {
    return 0
  }

  const nowIso = now.toISOString()
  const horizonIso = new Date(now.getTime() + env.REMINDER_LEAD_MINUTES * 60_000).toISOString()

  const due = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, 'confirmed'),
        isNull(bookings.reminderSentAt),
        gt(bookings.startAt, nowIso),
        lte(bookings.startAt, horizonIso),
      ),
    )

  let sent = 0

  for (const booking of due) {
    const claimed = await db
      .update(bookings)
      .set({ reminderSentAt: nowIso })
      .where(and(eq(bookings.id, booking.id), isNull(bookings.reminderSentAt)))
      .returning()

    if (claimed.length === 0) {
      continue
    }

    await notifyBookingReminder(booking)
    sent += 1
  }

  return sent
}

// Ленивый триггер при входящих запросах: не чаще раза в LAZY_THROTTLE_MS.
// В тестах выключен, чтобы фоновые запросы не примешивались к мокам fetch.
export function scheduleLazyReminderCheck(): void {
  if (env.NODE_ENV === 'test') {
    return
  }

  const now = Date.now()
  if (now - lastLazyCheckAt < LAZY_THROTTLE_MS) {
    return
  }

  lastLazyCheckAt = now

  void sendDueReminders().catch(() => {
    // напоминание не должно влиять на обслуживаемый запрос
  })
}
