import { ArrowRight, Calendar, LayoutDashboard } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  linkTo?: string
  linkLabel?: string
  variant?: 'desktop' | 'mobile'
  tabs?: { to: string; label: string; active: boolean }[]
}

// Панель организатора открыта без логина (ADR-0028), но на маршруты панели
// (/dashboard, /admin/*) переходим полной навигацией — обычным <a>: страница
// панели всегда грузится свежей с сервера, без клиентских кэшей SPA.
const isAdminRoute = (to: string) =>
  to === '/dashboard' || to === '/admin' || to.startsWith('/admin/')

export function AppHeader({
  linkTo,
  linkLabel,
  variant = 'desktop',
  tabs,
}: AppHeaderProps) {
  const isMobile = variant === 'mobile'

  return (
    <header className={cn('glass-bar', isMobile ? 'h-14' : 'h-16')}>
      <div
        className={cn(
          'mx-auto flex h-full items-center justify-between gap-3',
          isMobile ? 'w-full max-w-md px-4' : 'max-w-[1200px] px-6',
        )}
      >
        <div className="flex items-center gap-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <span
              className={cn(
                'flex items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-highlight text-white',
                isMobile ? 'size-7' : 'size-8',
              )}
            >
              <Calendar className={isMobile ? 'size-4' : 'size-[18px]'} strokeWidth={1.8} />
            </span>
            <h1 className={cn('font-semibold', isMobile ? 'text-[15px]' : 'text-base')}>
              Календарь звонков
            </h1>
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          {isMobile
            ? linkLabel && linkTo
              ? isAdminRoute(linkTo)
                ? (
                  <a
                    href={linkTo}
                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    {linkLabel}
                  </a>
                )
                : (
                  <Link
                    to={linkTo}
                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    {linkLabel}
                  </Link>
                )
              : (
                <Link
                  to="/my"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Мои встречи
                </Link>
              )
            : tabs
              ? (
                <nav
                  aria-label="Основная навигация"
                  className="flex items-center gap-1 rounded-full bg-secondary p-0.5"
                >
                  {tabs.map((tab) => (
                    <Link
                      key={tab.to}
                      to={tab.to}
                      aria-current={tab.active ? 'page' : undefined}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors',
                        tab.active
                          ? 'bg-card font-semibold text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </nav>
              )
              : linkTo && linkLabel
                ? isAdminRoute(linkTo)
                  ? (
                    <a
                      href={linkTo}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {linkLabel}
                      <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden="true" />
                    </a>
                  )
                  : (
                    <Link
                      to={linkTo}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {linkLabel}
                      <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden="true" />
                    </Link>
                  )
                : null}
          <a
            href="/dashboard"
            title="Панель организатора"
            aria-label="Панель организатора"
            className="inline-flex size-9 items-center justify-center rounded-full border border-input bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <LayoutDashboard className="size-4" strokeWidth={1.8} aria-hidden="true" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
