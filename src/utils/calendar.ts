import type { Booking, TimeSlot } from '@/types/booking'

function toUtcStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function eventDetails(booking: Booking): string {
  const lines = [`Имя: ${booking.name}`, `Email: ${booking.email}`]

  if (booking.phone) {
    lines.push(`Телефон: ${booking.phone}`)
  }

  if (booking.comment) {
    lines.push(`Комментарий: ${booking.comment}`)
  }

  return lines.join('\n')
}

interface CalendarEventOptions {
  title?: string
  now?: Date
}

function eventBounds(slot: TimeSlot) {
  const start = new Date(slot.startAt)
  const end = new Date(start.getTime() + slot.durationMin * 60 * 1000)

  return { startAt: start.toISOString(), endAt: end.toISOString() }
}

export function buildIcs(booking: Booking, slot: TimeSlot, options: CalendarEventOptions = {}): string {
  const title = options.title ?? 'Звонок'
  const stamp = (options.now ?? new Date()).toISOString()
  const { startAt, endAt } = eventBounds(slot)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Календарь звонков//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:booking-${booking.id}@call-calendar`,
    `DTSTAMP:${toUtcStamp(stamp)}`,
    `DTSTART:${toUtcStamp(startAt)}`,
    `DTEND:${toUtcStamp(endAt)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${eventDetails(booking).replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `${lines.join('\r\n')}\r\n`
}

export function googleCalendarUrl(
  booking: Booking,
  slot: TimeSlot,
  options: CalendarEventOptions = {},
): string {
  const title = options.title ?? 'Звонок'
  const { startAt, endAt } = eventBounds(slot)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toUtcStamp(startAt)}/${toUtcStamp(endAt)}`,
    details: eventDetails(booking),
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
