import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { TimeFormatContext } from '@/hooks/use-time-format'

const STORAGE_KEY = 'call-calendar-hour12'

function readInitial(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return window.localStorage?.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function TimeFormatProvider({ children }: { children: ReactNode }) {
  const [hour12, setHour12State] = useState(readInitial)

  const setHour12 = useCallback((value: boolean) => {
    setHour12State(value)

    try {
      window.localStorage?.setItem(STORAGE_KEY, String(value))
    } catch {
      // localStorage может быть недоступен — формат не сохранится, это не критично
    }
  }, [])

  const value = useMemo(() => ({ hour12, setHour12 }), [hour12, setHour12])

  return <TimeFormatContext.Provider value={value}>{children}</TimeFormatContext.Provider>
}
