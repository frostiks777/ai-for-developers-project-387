import { useEffect, useState } from 'react'
import { ArrowRight, CalendarCheck, Clock, MailCheck, UserRound, Video } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { EventType } from '@/api/generated'
import { LocationType } from '@/api/generated'
import { api, call } from '@/api/sdk'
import { AppHeader } from '@/components/app-header'
import { AppShell } from '@/components/app-shell'
import { useActiveHost } from '@/hooks/use-active-host'
import { Button } from '@/components/ui/button'
import { host } from '@/config/host'
import { useMediaQuery } from '@/hooks/use-media-query'
import { pluralRu } from '@/utils/plural'

const STEPS = [
  {
    icon: CalendarCheck,
    title: 'Выберите время',
    text: 'Свободные слоты на ближайшие две недели — в вашем часовом поясе.',
  },
  {
    icon: UserRound,
    title: 'Оставьте контакты',
    text: 'Имя и email обязательны, телефон — по желанию.',
  },
  {
    icon: MailCheck,
    title: 'Получите подтверждение',
    text: 'Ссылка для добавления в календарь, переноса или отмены встречи.',
  },
] as const

const LOCATION_FORMATS: Record<LocationType, string> = {
  [LocationType.Online]: 'Онлайн-звонок',
  [LocationType.Offline]: 'Очная встреча',
  [LocationType.Phone]: 'Телефонный звонок',
}

export default function LandingPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { activeSlug } = useActiveHost()
  const [hostName, setHostName] = useState<string | null>(null)
  const [durationMin, setDurationMin] = useState<number | null>(null)
  const [eventTypes, setEventTypes] = useState<EventType[]>([])

  useEffect(() => {
    let isActive = true

    Promise.all([
      call(api.getHostSettings(activeSlug)),
      call(api.availabilityClient.getAvailability(activeSlug)),
    ])
      .then(([settings, availability]) => {
        if (!isActive) {
          return
        }

        setHostName(settings.name?.trim() || null)
        setDurationMin(availability.slotDurationMin)
      })
      .catch(() => {
        // Лендинг — витрина: при недоступности API показываем данные из конфига
      })

    return () => {
      isActive = false
    }
  }, [activeSlug])

  useEffect(() => {
    let isActive = true

    call(api.eventTypesClient.listEventTypes(activeSlug))
      .then((types) => {
        if (isActive) {
          setEventTypes(Array.isArray(types) ? types.filter((type) => type.isActive) : [])
        }
      })
      .catch(() => {
        if (isActive) {
          setEventTypes([])
        }
      })

    return () => {
      isActive = false
    }
  }, [activeSlug])

  return (
    <AppShell>
      <AppHeader
        variant={isDesktop ? 'desktop' : 'mobile'}
        tabs={[
          { to: `/book/${activeSlug}`, label: 'Записаться', active: false },
          { to: '/my', label: 'Мои встречи', active: false },
        ]}
      />

      <main className="mx-auto w-full max-w-[1140px] flex-1 px-4 py-10 lg:px-6 lg:py-16">
        <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[13px] text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              Онлайн-запись открыта
            </span>
            <h2 className="mt-5 font-serif text-[36px] font-semibold leading-tight lg:text-[44px]">
              {host.meetingTitle}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] text-muted-foreground lg:text-base">
              Выберите удобное время и запишитесь на звонок с организатором. Подтверждение и
              детали встречи придут сразу после записи.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                className="h-12 rounded-xl bg-highlight px-6 text-[15px] text-highlight-foreground shadow-glow hover:bg-highlight/90"
                asChild
              >
                <Link to={`/book/${activeSlug}`}>
                  Выбрать время
                  <ArrowRight className="size-4" strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </Button>
              <span className="text-sm text-muted-foreground">Запись занимает меньше минуты</span>
            </div>
          </div>

          <div className="glass rounded-card p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
                {host.initials}
              </span>
              <div className="min-w-0">
                {hostName ? (
                  <>
                    <p className="text-sm text-muted-foreground">Организатор</p>
                    <p className="truncate font-semibold">{hostName}</p>
                  </>
                ) : (
                  <p className="font-semibold">{host.meetingTitle}</p>
                )}
              </div>
            </div>

            <ul className="mt-5 grid gap-3 text-sm">
              {durationMin !== null && (
                <li className="flex items-center gap-2.5">
                  <Clock className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                  {durationMin} {pluralRu(durationMin, ['минута', 'минуты', 'минут'])}
                </li>
              )}
              <li className="flex items-center gap-2.5">
                <Video className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
                {host.format}
              </li>
            </ul>
          </div>
        </section>

        {eventTypes.length > 1 && (
          <section className="mt-14">
            <h3 className="font-serif text-[24px] font-semibold leading-tight lg:text-[28px]">
              Форматы встречи
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {eventTypes.map((type) => (
                <Link
                  key={type.id}
                  to={`/book/${activeSlug}?type=${type.id}`}
                  className="glass rounded-card p-5 transition-colors hover:bg-accent/40"
                >
                  <p className="font-semibold">{type.title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {type.durationMin} {pluralRu(type.durationMin, ['минута', 'минуты', 'минут'])} ·{' '}
                    {LOCATION_FORMATS[type.locationType]}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <h3 className="font-serif text-[24px] font-semibold leading-tight lg:text-[28px]">
            Как это работает
          </h3>
          <ol className="mt-6 grid gap-4 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="glass rounded-card p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <step.icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                </span>
                <p className="mt-4 text-xs font-semibold text-muted-foreground">
                  Шаг {index + 1}
                </p>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14 flex flex-col items-start gap-4 rounded-card bg-surface p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-serif text-[22px] font-semibold leading-tight">
              Готовы выбрать время?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Свободные слоты обновляются автоматически.
            </p>
          </div>
          <Button variant="outline" className="h-12 px-6 text-[15px]" asChild>
            <Link to={`/book/${activeSlug}`}>Записаться на звонок</Link>
          </Button>
        </section>
      </main>
    </AppShell>
  )
}
