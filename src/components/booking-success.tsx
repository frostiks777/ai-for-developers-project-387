import { ArrowLeft, Calendar, Check, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useTimeFormat } from '@/hooks/use-time-format'
import { cn } from '@/lib/utils'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { buildIcs, downloadIcs, googleCalendarUrl } from '@/utils/calendar'
import { formatDayShortTitle, formatTimeRange, formatZoneShort, toDateKeyInZone } from '@/utils/timezone'

interface BookingSuccessProps {
  booking: CreatedBooking
  slot: TimeSlot
  timeZone: string
  eventTypeTitle?: string | null
  formatLabel?: string | null
  hostName?: string | null
  onReset: () => void
}

export function BookingSuccess({
  booking,
  slot,
  timeZone,
  eventTypeTitle,
  formatLabel,
  hostName,
  onReset,
}: BookingSuccessProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const { hour12 } = useTimeFormat()
  const cancelUrl = `${window.location.origin}/cancel/${booking.cancelToken}`
  const confirmedUrl = `${window.location.origin}/booking/${booking.id}/confirmed`
  const calendarOptions = eventTypeTitle ? { title: eventTypeTitle } : undefined
  const googleUrl = googleCalendarUrl(booking, slot, calendarOptions)
  const dateKey = toDateKeyInZone(new Date(slot.startAt), timeZone)

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Ссылка скопирована')
    } catch {
      toast.error('Не удалось скопировать ссылку')
    }
  }

  const handleDownload = () => {
    downloadIcs(`booking-${booking.id}.ics`, buildIcs(booking, slot, calendarOptions))
  }

  const details = (
    <dl className="grid gap-2.5 text-[15px]">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Формат</dt>
        <dd className="text-right font-semibold">{eventTypeTitle ?? formatLabel ?? 'Онлайн-звонок'}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Длительность</dt>
        <dd className="text-right font-semibold">{slot.durationMin} мин</dd>
      </div>
      {hostName && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Организатор</dt>
          <dd className="text-right font-semibold">{hostName}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Имя</dt>
        <dd className="text-right font-semibold">{booking.name}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Email</dt>
        <dd className="text-right font-semibold">{booking.email}</dd>
      </div>
      {booking.phone && (
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Телефон</dt>
          <dd className="text-right font-semibold">{booking.phone}</dd>
        </div>
      )}
    </dl>
  )

  return (
    <section
      className={cn(
        'flex w-full flex-col gap-4',
        isDesktop ? 'glass rounded-card p-8' : 'gap-4',
      )}
    >
      <Button
        variant="ghost"
        onClick={onReset}
        className="-ml-2 min-h-[44px] self-start px-2.5 text-sm font-medium shadow-none"
      >
        <ArrowLeft className="size-4" strokeWidth={1.8} aria-hidden="true" />
        Назад
      </Button>

      <div className={cn('flex items-center gap-3.5', isDesktop ? 'items-start' : 'flex-col text-center')}>
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"
        >
          <Check className="size-8" strokeWidth={2.4} />
        </span>
        <div>
          <h2 className="font-serif text-[26px] font-semibold leading-tight">
            Встреча успешно запланирована!
          </h2>
          <p className="mt-1 text-[16px] font-semibold">
            {formatDayShortTitle(dateKey)} · {formatTimeRange(slot, timeZone, hour12)}
          </p>
          <p className="text-[13px] text-muted-foreground">{formatZoneShort(timeZone)}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">{details}</div>

      <div className="flex flex-col gap-2.5">
        <Button
          asChild
          className="h-14 w-full rounded-[14px] bg-highlight text-base font-semibold text-highlight-foreground shadow-glow hover:bg-highlight/90"
        >
          <a href={googleUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="size-4" strokeWidth={1.8} aria-hidden="true" />
            Добавить в Google Календарь
          </a>
        </Button>
        <Button variant="outline" onClick={handleDownload} className="h-11 w-full">
          <Download className="size-4" strokeWidth={1.8} aria-hidden="true" />
          Скачать .ics
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Google Календарь или файл .ics для Apple и Outlook
        </p>
      </div>

      <div className="rounded-2xl bg-surface p-3.5">
        <p className="text-[13px] font-semibold">Планы изменились?</p>
        <div className="mt-2.5 flex flex-col gap-2">
          <Button variant="outline" asChild className="h-11 w-full">
            <Link to={`/reschedule/${booking.cancelToken}`} aria-label="Перенести встречу">
              Перенести
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="h-11 w-full border-destructive-border text-destructive"
          >
            <Link to={`/cancel/${booking.cancelToken}`}>
              Отменить встречу
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Встреча сохранена в «Мои встречи» на этом устройстве. Для другого устройства скопируйте
          ссылку
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            readOnly
            value={cancelUrl}
            aria-label="Ссылка для отмены"
            className="h-11 min-w-0"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => handleCopy(confirmedUrl)}
            className="h-11 shrink-0"
          >
            Скопировать ссылку
          </Button>
        </div>
      </div>

      <Button
        variant="ghost"
        onClick={onReset}
        className="h-11 w-full text-[15px] font-semibold text-primary"
      >
        Выбрать другое время
      </Button>
    </section>
  )
}
