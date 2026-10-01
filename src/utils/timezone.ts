const fallbackTimeZones = [
  'UTC',
  'Europe/Moscow',
  'Europe/Berlin',
  'Asia/Almaty',
  'Asia/Tbilisi',
  'America/New_York',
]

export const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

export const timeZoneOptions = Array.from(new Set([defaultTimeZone, ...fallbackTimeZones]))

// Полный список IANA-поясов (с фолбэком для сред без Intl.supportedValuesOf)
export const allTimeZones: string[] = (() => {
  const supported =
    typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : []
  return Array.from(new Set(['UTC', defaultTimeZone, ...supported, ...fallbackTimeZones]))
})()

export function searchTimeZones(query: string, limit = 60): string[] {
  const normalized = query.trim().toLowerCase()

  if (normalized === '') {
    return timeZoneOptions
  }

  return allTimeZones.filter((timeZone) => timeZone.toLowerCase().includes(normalized)).slice(0, limit)
}

export function toDateKeyInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatDateTimeInZone(iso: string, timeZone: string, hour12?: boolean): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12,
  }).format(new Date(iso))
}

export function formatTimeInZone(iso: string, timeZone: string, hour12?: boolean): string {
  return new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  }).format(new Date(iso))
}

// День календаря не зависит от пояса: собираем дату из ключа и форматируем в UTC
export function formatDayTitle(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const title = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(year, month - 1, day)))

  return title.charAt(0).toUpperCase() + title.slice(1)
}

// Короткий заголовок дня для мобильной панели: «Чт, 24 сентября»
export function formatDayShortTitle(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const title = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(new Date(Date.UTC(year, month - 1, day)))

  return title.charAt(0).toUpperCase() + title.slice(1)
}

// Сокращённый день недели по календарной дате: «Пн».
// Через Date.UTC и timeZone: 'UTC', иначе полночь смещается в локальном поясе
// (баг: 2026-09-28 в Europe/Moscow превращался в 27 сентября, воскресенье).
export function formatWeekdayShort(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const title = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'short',
  }).format(new Date(Date.UTC(year, month - 1, day)))

  return title.charAt(0).toUpperCase() + title.slice(1)
}

// Дата для диалога брони с годом: «Чт, 24 сентября 2026»
export function formatDialogDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const raw = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))

  const withoutYearSuffix = raw.replace(/\s*г\.?$/, '')
  return withoutYearSuffix.charAt(0).toUpperCase() + withoutYearSuffix.slice(1)
}

export function formatTimeRange(
  slot: { startAt: string; durationMin: number },
  timeZone: string,
  hour12?: boolean,
): string {
  const start = new Date(slot.startAt)
  const end = new Date(start.getTime() + slot.durationMin * 60_000)

  return `${formatTimeInZone(start.toISOString(), timeZone, hour12)} – ${formatTimeInZone(end.toISOString(), timeZone, hour12)}`
}

export function timeZoneOptionLabel(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date())
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value

  return offset ? `${timeZone} (${offset})` : timeZone
}

// Предложный падеж для частых поясов: «по Москве», «по Берлину».
// Для остальных — «по {IANA}».
const zoneCityPrepositional: Record<string, string> = {
  UTC: 'UTC',
  'Europe/Moscow': 'Москве',
  'Europe/Berlin': 'Берлину',
  'Europe/Kiev': 'Киеву',
  'Asia/Almaty': 'Алматы',
  'Asia/Tbilisi': 'Тбилиси',
  'America/New_York': 'Нью-Йорку',
  'Asia/Dubai': 'Дубаю',
  'Europe/London': 'Лондону',
  'Europe/Paris': 'Парижу',
  'Asia/Yekaterinburg': 'Екатеринбургу',
  'Asia/Novosibirsk': 'Новосибирску',
}

// Смещение пояса в формате UTC+3 / UTC+5:30 / UTC+0
export function formatZoneOffsetLabel(timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(new Date())
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT'

  if (offset === 'GMT' || offset === 'UTC') {
    return 'UTC+0'
  }

  return offset.replace('GMT', 'UTC')
}

// «по Москве (UTC+3)» — подпись пояса гостя
export function formatZoneShort(timeZone: string): string {
  const label = zoneCityPrepositional[timeZone] ?? timeZone

  return `по ${label} (${formatZoneOffsetLabel(timeZone)})`
}

// Час начала слота в заданном поясе (0–23). Для группировки «Утром / Днём / Вечером».
export function hourInZone(iso: string, timeZone: string): number {
  return Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      hour12: false,
    }).format(new Date(iso)),
  )
}

const WEEKDAY_BY_SHORT: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
}

// День недели (1=Пн…7=Вс) и минута от начала суток в заданном поясе.
export function weekdayAndMinuteInZone(
  iso: string,
  timeZone: string,
): { weekday: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  return {
    weekday: WEEKDAY_BY_SHORT[value('weekday')] ?? 1,
    minute: Number(value('hour')) * 60 + Number(value('minute')),
  }
}
