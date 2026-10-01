import { Clock, Globe, Hourglass, Video } from 'lucide-react'

import { LocationType, type EventType } from '@/api/generated'
import { TimeFormatToggle } from '@/components/time-format-toggle'
import { TimeZoneSelect } from '@/components/timezone-select'
import { host } from '@/config/host'
import { pluralRu } from '@/utils/plural'

const LOCATION_FORMATS: Record<LocationType, string> = {
  [LocationType.Online]: 'Онлайн-звонок',
  [LocationType.Offline]: 'Очная встреча',
  [LocationType.Phone]: 'Телефонный звонок',
}

interface HostInfoProps {
  eventType?: EventType | null
  durationMin: number | null
  minNoticeMin: number | null
  timeZone: string
  onTimeZoneChange: (timeZone: string) => void
}

function formatMinNotice(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60

    return `${hours} ${pluralRu(hours, ['час', 'часа', 'часов'])}`
  }

  return `${minutes} ${pluralRu(minutes, ['минута', 'минуты', 'минут'])}`
}

export function HostInfo({
  eventType,
  durationMin,
  minNoticeMin,
  timeZone,
  onTimeZoneChange,
}: HostInfoProps) {
  const meetingTitle = eventType?.title ?? host.meetingTitle
  const format = eventType ? LOCATION_FORMATS[eventType.locationType] : host.format

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex size-14 items-center justify-center rounded-full bg-accent text-lg font-semibold text-accent-foreground">
        {host.initials}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{host.name}</p>
      <h2 className="mt-1 break-words font-serif text-[30px] font-semibold leading-tight">
        {meetingTitle}
      </h2>

      <ul className="mt-5 grid gap-3 text-sm">
        {durationMin !== null && (
          <li className="flex items-center gap-2.5">
            <Clock className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            {durationMin} {pluralRu(durationMin, ['минута', 'минуты', 'минут'])}
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <Video className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          {format}
        </li>
        {minNoticeMin !== null && (
          <li className="flex items-start gap-2.5">
            <Hourglass className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            Бронь не позже чем за {formatMinNotice(minNoticeMin)}
          </li>
        )}
      </ul>

      <div className="mt-auto pt-8">
        <TimeZoneSelect
          value={timeZone}
          onChange={onTimeZoneChange}
          labelIcon={<Globe className="size-4 text-muted-foreground" strokeWidth={1.8} />}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Формат: 24 ч / 12 ч</span>
          <TimeFormatToggle />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Пояс определён по вашему браузеру</p>
      </div>
    </div>
  )
}
