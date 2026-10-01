import type { ReactNode } from 'react'

import { AmbientBackground } from '@/components/ambient-background'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <>
      <AmbientBackground />
      <div className={cn('relative z-10 flex min-h-screen flex-col', className)}>{children}</div>
    </>
  )
}
