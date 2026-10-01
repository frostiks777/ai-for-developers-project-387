import { useId } from 'react'

import { useActiveHost } from '@/hooks/use-active-host'
import { cn } from '@/lib/utils'

// Переключатель активного организатора в панели (ADR-0021). Выбор хранится
// на устройстве и скоупит все секции панели.
export function HostSelect({ className }: { className?: string }) {
  const { hosts, activeSlug, setActiveSlug, isLoading } = useActiveHost()
  const selectId = useId()

  const hasActiveOption = hosts.some((host) => host.slug === activeSlug || host.id === activeSlug)

  return (
    <label
      htmlFor={selectId}
      className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
    >
      <span className="whitespace-nowrap">Организатор</span>
      <select
        id={selectId}
        value={activeSlug}
        disabled={isLoading || hosts.length === 0}
        onChange={(event) => setActiveSlug(event.target.value)}
        className="h-9 min-w-[180px] rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
      >
        {!hasActiveOption && <option value={activeSlug}>{activeSlug}</option>}
        {hosts.map((host) => (
          <option key={host.id} value={host.slug}>
            {host.name} · {host.slug}
          </option>
        ))}
      </select>
    </label>
  )
}
