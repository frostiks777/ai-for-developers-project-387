import { useCallback, useState } from 'react'

export type BookingView = 'days' | 'week'

const STORAGE_KEY = 'call-calendar-booking-view'

function readView(): BookingView {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'week' ? 'week' : 'days'
  } catch {
    return 'days'
  }
}

export function useBookingView() {
  const [view, setViewState] = useState<BookingView>(readView)

  const setView = useCallback((next: BookingView) => {
    setViewState(next)

    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // приватный режим или отключённое хранилище — выбор не сохраняем
    }
  }, [])

  return { view, setView }
}
