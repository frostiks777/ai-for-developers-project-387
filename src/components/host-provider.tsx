import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { Host } from '@/api/generated'
import { api, call } from '@/api/sdk'
import {
  DEFAULT_HOST_SLUG,
  HostContext,
  readStoredHostSlug,
  writeStoredHostSlug,
} from '@/hooks/use-active-host'

export function HostProvider({ children }: { children: ReactNode }) {
  const [hosts, setHosts] = useState<Host[]>([])
  const [activeSlug, setActiveSlugState] = useState<string>(
    () => readStoredHostSlug() ?? DEFAULT_HOST_SLUG,
  )
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    setIsLoading(true)

    try {
      const list = await call(api.hostsClient.listHosts())
      setHosts(list)
      setActiveSlugState((current) => {
        if (list.some((host) => host.slug === current || host.id === current)) {
          return current
        }

        return list[0]?.slug ?? current
      })
    } catch {
      setHosts([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const setActiveSlug = useCallback((slug: string) => {
    setActiveSlugState(slug)
    writeStoredHostSlug(slug)
  }, [])

  const activeHost = useMemo(
    () => hosts.find((host) => host.slug === activeSlug || host.id === activeSlug) ?? null,
    [hosts, activeSlug],
  )

  const value = useMemo(
    () => ({ hosts, activeSlug, activeHost, setActiveSlug, reload, isLoading }),
    [hosts, activeSlug, activeHost, setActiveSlug, reload, isLoading],
  )

  return <HostContext.Provider value={value}>{children}</HostContext.Provider>
}
