import { useState } from 'react'
import {
  Building2,
  Calendar,
  CalendarOff,
  Check,
  Copy,
  ExternalLink,
  LayoutDashboard,
  ListChecks,
  SlidersHorizontal,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { ThemeToggle } from '@/components/theme-toggle'
import { useActiveHost } from '@/hooks/use-active-host'
import { formatZoneShort, defaultTimeZone } from '@/utils/timezone'

interface DashboardSidebarProps {
  bookingCount: number
}

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  count?: number
}

export function DashboardSidebar({ bookingCount }: DashboardSidebarProps) {
  const { activeSlug } = useActiveHost()
  const [copied, setCopied] = useState(false)
  const bookingUrl = `${window.location.origin}/book/${activeSlug}`

  const items: NavItem[] = [
    { to: '/dashboard', label: 'Обзор', icon: LayoutDashboard, count: bookingCount },
    { to: '/admin/bookings', label: 'Все встречи', icon: Calendar },
    { to: '/admin/event-types', label: 'Типы встреч', icon: ListChecks },
    { to: '/admin/availability', label: 'Доступность', icon: SlidersHorizontal },
    { to: '/admin/blocks', label: 'Блокировки', icon: CalendarOff },
    { to: '/admin/hosts', label: 'Организаторы', icon: Building2 },
  ]

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // буфер может быть недоступен
    }
  }

  return (
    <nav
      aria-label="Панель организатора"
      className="glass sticky top-0 flex h-screen w-[240px] shrink-0 flex-col gap-1.5 self-start overflow-hidden p-4"
    >
      <Link
        to="/"
        aria-label="На главную"
        className="flex items-center gap-2.5 rounded-lg px-2 pb-5 pt-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="flex size-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-primary to-highlight text-white">
          <Calendar className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <h1 className="text-[15px] font-semibold">Календарь звонков</h1>
      </Link>

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                [
                  'flex h-11 items-center gap-2.5 rounded-lg px-3 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                  isActive
                    ? 'bg-accent font-semibold text-accent-foreground'
                    : 'font-medium text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground',
                ].join(' ')
              }
            >
              <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
              {item.label}
              {item.count !== undefined && (
                <span className="ml-auto rounded-full bg-card px-2 py-0.5 text-xs font-semibold">
                  {item.count}
                </span>
              )}
            </NavLink>
          )
        })}
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t pt-4">
        <div className="rounded-xl bg-surface/60 p-3">
          <p className="text-xs font-semibold text-muted-foreground">Ссылка для записи</p>
          <p className="mt-1 truncate text-[13px]" title={bookingUrl}>
            {bookingUrl}
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 text-[13px] font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {copied ? (
              <Check className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
            )}
            {copied ? 'Скопировано' : 'Скопировать'}
          </button>
        </div>

        <Link
          to={`/book/${activeSlug}`}
          className="flex min-h-11 items-center gap-2 px-3 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ExternalLink className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Страница бронирования
        </Link>
        <div className="flex items-center justify-between gap-2 pl-3 pr-1">
          <span className="text-xs text-muted-foreground">
            Ваш пояс: {formatZoneShort(defaultTimeZone)}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
