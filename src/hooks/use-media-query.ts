import { useCallback, useSyncExternalStore } from 'react'

// Возвращает fallback, если window.matchMedia недоступен (например, в jsdom)
export function useMediaQuery(query: string, fallback = true): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {}
      }

      const mediaQuery = window.matchMedia(query)
      mediaQuery.addEventListener('change', onChange)
      return () => mediaQuery.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return fallback
    }

    return window.matchMedia(query).matches
  }, [query, fallback])

  return useSyncExternalStore(subscribe, getSnapshot, () => fallback)
}
