import type { EmailMessage } from './email'

export interface BookingEmailData {
  origin: string
  eventTypeTitle: string
  hostName: string
  timeZone: string
  clientName: string
  clientEmail: string
  startAt: string
  endAt: string
  bookingId: string
  guests?: string[]
}

const guestList = (guests?: string[]): string =>
  guests && guests.length > 0 ? `\nГости: ${guests.join(', ')}` : ''

const guestListHtml = (guests?: string[]): string =>
  guests && guests.length > 0
    ? `<p>Гости: ${guests.map(escapeHtml).join(', ')}</p>`
    : ''

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const manageUrl = (data: BookingEmailData): string =>
  `${data.origin}/booking/${data.bookingId}/reschedule`

const timeFormatters = new Map<string, Intl.DateTimeFormat>()

const timeFormatter = (timeZone: string): Intl.DateTimeFormat => {
  const cached = timeFormatters.get(timeZone)

  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  timeFormatters.set(timeZone, formatter)

  return formatter
}

export const formatWhen = (data: BookingEmailData): string => {
  const start = new Date(data.startAt)
  const end = new Date(data.endAt)
  const day = new Intl.DateTimeFormat('ru-RU', {
    timeZone: data.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(start)
  const time = timeFormatter(data.timeZone)

  return `${day}, ${time.format(start)}–${time.format(end)} (${data.timeZone})`
}

const layout = (data: BookingEmailData, heading: string, bodyHtml: string): string => `<!doctype html>
<html lang="ru">
  <body>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(data.eventTypeTitle)} · ${escapeHtml(formatWhen(data))}</p>
    <p>Организатор: ${escapeHtml(data.hostName)}</p>
    ${bodyHtml}
    <p><a href="${escapeHtml(manageUrl(data))}">Перенести или отменить встречу</a></p>
  </body>
</html>`

export const bookingConfirmedEmail = (data: BookingEmailData): EmailMessage => ({
  to: data.clientEmail,
  subject: `Вы записаны: ${data.eventTypeTitle} — ${formatWhen(data)}`,
  text: `Здравствуйте, ${data.clientName}!

Встреча «${data.eventTypeTitle}» запланирована: ${formatWhen(data)}.
Организатор: ${data.hostName}.${guestList(data.guests)}

Перенести или отменить встречу: ${manageUrl(data)}`,
  html: layout(
    data,
    'Встреча запланирована',
    `<p>Здравствуйте, ${escapeHtml(data.clientName)}!</p>${guestListHtml(data.guests)}`,
  ),
})

export const bookingRescheduledEmail = (data: BookingEmailData): EmailMessage => ({
  to: data.clientEmail,
  subject: `Встреча перенесена: ${data.eventTypeTitle} — ${formatWhen(data)}`,
  text: `Здравствуйте, ${data.clientName}!

Встреча «${data.eventTypeTitle}» перенесена на ${formatWhen(data)}.
Организатор: ${data.hostName}.

Управление встречей: ${manageUrl(data)}`,
  html: layout(data, 'Встреча перенесена', `<p>Здравствуйте, ${escapeHtml(data.clientName)}!</p>`),
})

export const bookingCancelledEmail = (
  data: BookingEmailData,
  reason?: string,
): EmailMessage => ({
  to: data.clientEmail,
  subject: `Встреча отменена: ${data.eventTypeTitle} — ${formatWhen(data)}`,
  text: `Здравствуйте, ${data.clientName}!

Встреча «${data.eventTypeTitle}» (${formatWhen(data)}) отменена.${
    reason ? `\nПричина: ${reason}` : ''
  }

Записаться на другое время: ${data.origin}/book`,
  html: layout(
    data,
    'Встреча отменена',
    `<p>Здравствуйте, ${escapeHtml(data.clientName)}!</p>${
      reason ? `<p>Причина: ${escapeHtml(reason)}</p>` : ''
    }`,
  ),
})

export const bookingReminderEmail = (data: BookingEmailData): EmailMessage => ({
  to: data.clientEmail,
  subject: `Напоминание о встрече: ${data.eventTypeTitle} — ${formatWhen(data)}`,
  text: `Здравствуйте, ${data.clientName}!

Напоминаем: встреча «${data.eventTypeTitle}» — ${formatWhen(data)}.
Организатор: ${data.hostName}.${guestList(data.guests)}

Перенести или отменить встречу: ${manageUrl(data)}`,
  html: layout(
    data,
    'Напоминание о встрече',
    `<p>Здравствуйте, ${escapeHtml(data.clientName)}!</p>${guestListHtml(data.guests)}`,
  ),
})

export const organizerNewBookingEmail = (
  data: BookingEmailData,
  organizerEmail: string,
): EmailMessage => ({
  to: organizerEmail,
  subject: `Новая бронь: ${data.eventTypeTitle} — ${formatWhen(data)}`,
  text: `Новая бронь: «${data.eventTypeTitle}» — ${formatWhen(data)}.
Гость: ${data.clientName} <${data.clientEmail}>.${guestList(data.guests)}

Панель организатора: ${data.origin}/dashboard`,
  html: layout(
    data,
    'Новая бронь',
    `<p>Гость: ${escapeHtml(data.clientName)} &lt;${escapeHtml(data.clientEmail)}&gt;</p>${guestListHtml(
      data.guests,
    )}`,
  ),
})

export const organizerCancelledEmail = (
  data: BookingEmailData,
  organizerEmail: string,
  reason?: string,
): EmailMessage => ({
  to: organizerEmail,
  subject: `Бронь отменена: ${data.eventTypeTitle} — ${formatWhen(data)}`,
  text: `Бронь отменена: «${data.eventTypeTitle}» — ${formatWhen(data)}.
Гость: ${data.clientName} <${data.clientEmail}>.${reason ? `\nПричина: ${reason}` : ''}

Панель организатора: ${data.origin}/dashboard`,
  html: layout(
    data,
    'Бронь отменена',
    `<p>Гость: ${escapeHtml(data.clientName)} &lt;${escapeHtml(data.clientEmail)}&gt;</p>${
      reason ? `<p>Причина: ${escapeHtml(reason)}</p>` : ''
    }`,
  ),
})
