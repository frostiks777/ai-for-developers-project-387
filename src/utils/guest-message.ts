import { formatDayShortTitle, formatTimeInZone, formatZoneShort, toDateKeyInZone } from '@/utils/timezone'

interface GuestMessageBooking {
  name: string
  eventTypeTitle?: string | null
  startAt: string
}

interface GuestMessageContext {
  hostSlug: string
  timeZone: string
  origin?: string
}

// Текст для гостя при отмене встречи организатором (дизайн-спека v2 §4.2)
export function buildGuestMessage(booking: GuestMessageBooking, context: GuestMessageContext): string {
  const origin = context.origin ?? window.location.origin
  const dateKey = toDateKeyInZone(new Date(booking.startAt), context.timeZone)
  const date = formatDayShortTitle(dateKey).split(',')[0]
  const time = formatTimeInZone(booking.startAt, context.timeZone)
  const title = booking.eventTypeTitle ? `«${booking.eventTypeTitle}»` : 'встреча'

  return `Здравствуйте, ${booking.name}! Встреча ${title} ${date} в ${time} (${formatZoneShort(
    context.timeZone,
  )}) отменена. Выбрать новое время: ${origin}/book/${context.hostSlug}`
}
