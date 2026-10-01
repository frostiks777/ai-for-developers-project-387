// «Мои встречи»: брони, созданные в этом браузере. Токен отмены/переноса —
// capability-ссылка, поэтому храним только id (он же cancelToken), время и тип (ADR-0019).

export interface SavedBooking {
  id: string
  startAt: string
  durationMin: number
  eventTypeTitle: string | null
  hostSlug: string
}

const STORAGE_KEY = 'call-calendar-my-bookings'
const MAX_ITEMS = 50

export function listMyBookings(): SavedBooking[] {
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed: unknown = JSON.parse(raw)

    return Array.isArray(parsed) ? (parsed as SavedBooking[]) : []
  } catch {
    return []
  }
}

export function saveMyBooking(booking: SavedBooking): void {
  try {
    const rest = listMyBookings().filter((item) => item.id !== booking.id)
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify([booking, ...rest].slice(0, MAX_ITEMS)))
  } catch {
    // localStorage может быть недоступен — просто не сохраняем
  }
}

export function removeMyBooking(id: string): void {
  try {
    const rest = listMyBookings().filter((item) => item.id !== id)
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(rest))
  } catch {
    // ignore
  }
}

// Новое время встречи после переноса — обновляем сохранённую запись,
// чтобы «Мои встречи» и страница управления показывали актуальные данные.
export function updateMyBookingTime(id: string, startAt: string): void {
  try {
    const updated = listMyBookings().map((item) =>
      item.id === id ? { ...item, startAt } : item,
    )
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
}
