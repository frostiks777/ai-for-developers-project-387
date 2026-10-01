import { createContext, useContext } from 'react'

import type { Host } from '@/api/generated'

// Активный организатор хранится на устройстве (ADR-0021); при отсутствии —
// первый из списка хостов, а если список ещё не загружен — 'default'.
const STORAGE_KEY = 'call-calendar-active-host'
export const DEFAULT_HOST_SLUG = 'default'

export function readStoredHostSlug(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function writeStoredHostSlug(slug: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, slug)
  } catch {
    // приватный режим/недоступное хранилище — молча игнорируем
  }
}

export interface HostContextValue {
  hosts: Host[]
  activeSlug: string
  activeHost: Host | null
  setActiveSlug: (slug: string) => void
  reload: () => Promise<void>
  isLoading: boolean
}

// Дефолтное значение нужно для юнит-тестов страниц без провайдера:
// активным считается 'default', список пуст, переключение — no-op.
export const HostContext = createContext<HostContextValue>({
  hosts: [],
  activeSlug: DEFAULT_HOST_SLUG,
  activeHost: null,
  setActiveSlug: () => {},
  reload: async () => {},
  isLoading: false,
})

export function useActiveHost(): HostContextValue {
  return useContext(HostContext)
}
