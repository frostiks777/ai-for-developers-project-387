// Правила доступности организатора.
// До появления таблиц hosts/availability_rules правила живут в коде и заданы в UTC.
export interface AvailabilityRules {
  // Дни недели по JS: 0 — воскресенье, 1 — понедельник, … 6 — суббота
  weekdays: number[]
  windowStartHour: number
  windowEndHour: number
  slotDurationMin: number
  // Буфер до начала встречи (минуты)
  bufferBeforeMin: number
  // Буфер после встречи (минуты)
  bufferAfterMin: number
  minNoticeMin: number
  horizonDays: number
}

export const defaultAvailabilityRules: AvailabilityRules = {
  weekdays: [1, 2, 3, 4, 5],
  windowStartHour: 10,
  windowEndHour: 18,
  slotDurationMin: 30,
  bufferBeforeMin: 0,
  // Буферы не входят в шаг сетки: по умолчанию 0, иначе после брони
  // соседние слоты молча выпадали бы из выдачи (#89).
  bufferAfterMin: 0,
  minNoticeMin: 120,
  horizonDays: 14,
}

// Строка таблицы availability_rules: weekdays хранятся как JSON-массив
export interface AvailabilityRulesRow {
  weekdays: string
  windowStartHour: number
  windowEndHour: number
  slotDurationMin: number
  bufferBeforeMin: number
  bufferAfterMin: number
  minNoticeMin: number
  horizonDays: number
}

function parseWeekdays(value: string): number[] {
  try {
    const parsed: unknown = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (day): day is number => Number.isInteger(day) && day >= 0 && day <= 6,
      )
    }
  } catch {
    // повреждённое значение — вернём пустой список, вызывающий код отбросит правило
  }

  return []
}

export function rulesFromRow(row: AvailabilityRulesRow): AvailabilityRules {
  return {
    weekdays: parseWeekdays(row.weekdays),
    windowStartHour: row.windowStartHour,
    windowEndHour: row.windowEndHour,
    slotDurationMin: row.slotDurationMin,
    bufferBeforeMin: row.bufferBeforeMin ?? 0,
    bufferAfterMin: row.bufferAfterMin ?? 0,
    minNoticeMin: row.minNoticeMin,
    horizonDays: row.horizonDays,
  }
}

export function rulesToRow(rules: AvailabilityRules): AvailabilityRulesRow {
  return {
    weekdays: JSON.stringify([...new Set(rules.weekdays)].sort((a, b) => a - b)),
    windowStartHour: rules.windowStartHour,
    windowEndHour: rules.windowEndHour,
    slotDurationMin: rules.slotDurationMin,
    bufferBeforeMin: rules.bufferBeforeMin,
    bufferAfterMin: rules.bufferAfterMin,
    minNoticeMin: rules.minNoticeMin,
    horizonDays: rules.horizonDays,
  }
}

const MS_PER_MINUTE = 60 * 1000

// Генерирует ISO-времена начал слотов от now на горизонт вперёд.
// Слот попадает в результат, если он целиком укладывается в рабочее окно,
// начинается не раньше now + minNotice и день входит в рабочие дни.
// Шаг сетки — slotDurationMin: буферы двигать сетку не должны (спека, #89),
// они применяются фильтром занятости — см. conflictsWithBuffers.
export function generateSlotStarts(
  now: Date,
  rules: AvailabilityRules = defaultAvailabilityRules,
): string[] {
  const starts: string[] = []
  const earliest = now.getTime() + rules.minNoticeMin * MS_PER_MINUTE
  const stepMin = rules.slotDurationMin
  const windowEndMin = rules.windowEndHour * 60

  for (let dayOffset = 0; dayOffset < rules.horizonDays; dayOffset += 1) {
    const day = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset),
    )

    if (!rules.weekdays.includes(day.getUTCDay())) {
      continue
    }

    for (
      let minute = rules.windowStartHour * 60;
      minute + rules.slotDurationMin <= windowEndMin;
      minute += stepMin
    ) {
      const startAt = Date.UTC(
        day.getUTCFullYear(),
        day.getUTCMonth(),
        day.getUTCDate(),
        0,
        minute,
      )

      if (startAt < earliest) {
        continue
      }

      starts.push(new Date(startAt).toISOString())
    }
  }

  return starts
}

// ── Буферы как фильтр занятости, а не как шаг сетки (#89) ────────────────

export interface TimeIntervalLike {
  startAt: string
  endAt: string
}

const addMinutes = (iso: string, minutes: number): string =>
  new Date(new Date(iso).getTime() + minutes * MS_PER_MINUTE).toISOString()

/**
 * Возвращает true, если слот [slotStartAt, slotEndAt) конфликтует с буферами
 * вокруг уже занятых встреч.
 *
 * Буфер после занятой встречи отодвигает её конец, буфер до — отодвигает начало
 * нашей встречи назад: слот не должен начинаться раньше, чем закончится буфер.
 * Сетка при этом не сдвигается — конфликтный слот просто не выдаётся.
 */
export function conflictsWithBuffers(
  slotStartAt: string,
  slotEndAt: string,
  busyIntervals: TimeIntervalLike[],
  bufferBeforeMin: number,
  bufferAfterMin: number,
): boolean {
  const slotStart = new Date(slotStartAt).getTime()
  const slotEnd = new Date(slotEndAt).getTime()

  return busyIntervals.some((busy) => {
    const busyStart = new Date(addMinutes(busy.startAt, -bufferBeforeMin)).getTime()
    const busyEnd = new Date(addMinutes(busy.endAt, bufferAfterMin)).getTime()

    return slotStart < busyEnd && busyStart < slotEnd
  })
}

// ── v1: диапазоны по дням недели (ADR-0011) ──────────────────────────────

// День недели: 1 — понедельник … 7 — воскресенье; минуты от полуночи (пояс хоста)
export interface AvailabilityRange {
  weekday: number
  startMinute: number
  endMinute: number
}

export interface AvailabilitySettings {
  timeZone: string
  slotDurationMin: number
  bufferBeforeMin: number
  bufferAfterMin: number
  minNoticeMin: number
  horizonDays: number
  ranges: AvailabilityRange[]
}

const jsDayToIso = (jsDay: number): number => (jsDay === 0 ? 7 : jsDay)

// Смещение пояса в минутах для конкретного UTC-момента (ISO-строка смещения → минуты)
function zoneOffsetMinutes(timeZone: string, utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'longOffset',
  }).formatToParts(new Date(utcMs))
  const offset = parts.find((part) => part.type === 'timeZoneName')?.value ?? 'GMT'

  if (offset === 'GMT' || offset === 'UTC') {
    return 0
  }

  const match = offset.match(/GMT([+-])(\d{2}):?(\d{2})?/)

  if (!match) {
    return 0
  }

  const sign = match[1] === '-' ? -1 : 1
  const hours = Number(match[2])
  const minutes = Number(match[3] ?? '0')

  return sign * (hours * 60 + minutes)
}

// Календарный день и день недели для момента в заданном поясе
function zonedDateParts(timeZone: string, utcMs: number) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date(utcMs))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  const weekdayShort = get('weekday')
  const weekdayMap: Record<string, number> = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7,
  }

  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    isoWeekday: weekdayMap[weekdayShort] ?? 1,
  }
}

// Локальное время (y/m/d, минуты от полуночи) в поясе → UTC-миллисекунды.
// Повторная проверка смещения на найденный момент закрывает переходы на летнее время.
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  minute: number,
  timeZone: string,
): number {
  const naiveUtc = Date.UTC(year, month - 1, day, 0, minute)
  const firstGuess = naiveUtc - zoneOffsetMinutes(timeZone, naiveUtc) * 60_000
  const secondOffset = zoneOffsetMinutes(timeZone, firstGuess)

  return naiveUtc - secondOffset * 60_000
}

// Проверяет, что найденный UTC-момент действительно соответствует запрошенному
// локальному времени в поясе (нужно на переходе «вперёд»: несуществующее время
// вроде 02:00 в Europe/Berlin не должно превращаться в 03:00 и дублировать его).
function isLocalTimeValid(
  year: number,
  month: number,
  day: number,
  minute: number,
  timeZone: string,
  utcMs: number,
): boolean {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(utcMs))
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? '0')

  return (
    get('year') === year &&
    get('month') === month &&
    get('day') === day &&
    get('hour') * 60 + get('minute') === minute
  )
}

// Преобразует одно окно из легаси-правил в набор диапазонов (по дню недели)
export function rangesFromRules(rules: AvailabilityRules): AvailabilityRange[] {
  return rules.weekdays
    .map((jsDay) => ({
      weekday: jsDayToIso(jsDay),
      startMinute: rules.windowStartHour * 60,
      endMinute: rules.windowEndHour * 60,
    }))
    .sort((a, b) => a.weekday - b.weekday)
}

// Обратное преобразование: диапазоны → рабочие дни и окно для легаси-схемы
export function windowFromRanges(
  ranges: AvailabilityRange[],
  fallback: AvailabilityRules = defaultAvailabilityRules,
): Pick<AvailabilityRules, 'weekdays' | 'windowStartHour' | 'windowEndHour'> {
  if (ranges.length === 0) {
    return {
      weekdays: fallback.weekdays,
      windowStartHour: fallback.windowStartHour,
      windowEndHour: fallback.windowEndHour,
    }
  }

  const weekdays = [...new Set(ranges.map((range) => range.weekday % 7))].sort((a, b) => a - b)
  const startMinute = Math.min(...ranges.map((range) => range.startMinute))
  const endMinute = Math.max(...ranges.map((range) => range.endMinute))

  return {
    weekdays,
    windowStartHour: Math.floor(startMinute / 60),
    windowEndHour: Math.ceil(endMinute / 60),
  }
}

export function defaultAvailabilitySettings(timeZone: string): AvailabilitySettings {
  return {
    timeZone,
    slotDurationMin: defaultAvailabilityRules.slotDurationMin,
    bufferBeforeMin: defaultAvailabilityRules.bufferBeforeMin,
    bufferAfterMin: defaultAvailabilityRules.bufferAfterMin,
    minNoticeMin: defaultAvailabilityRules.minNoticeMin,
    horizonDays: defaultAvailabilityRules.horizonDays,
    ranges: rangesFromRules(defaultAvailabilityRules),
  }
}

// Генерирует ISO-времена начал слотов по диапазонам дней недели в поясе хоста.
// Шаг сетки — slotDurationMin, буферы сетку не двигают (спека, #89).
export function generateSlotStartsFromRanges(now: Date, settings: AvailabilitySettings): string[] {
  const starts: string[] = []
  const earliest = now.getTime() + settings.minNoticeMin * MS_PER_MINUTE
  const stepMin = settings.slotDurationMin
  const timeZone = settings.timeZone || 'UTC'

  for (let dayOffset = 0; dayOffset < settings.horizonDays; dayOffset += 1) {
    const dayParts = zonedDateParts(timeZone, now.getTime() + dayOffset * 24 * 60 * MS_PER_MINUTE)
    const ranges = settings.ranges
      .filter((range) => range.weekday === dayParts.isoWeekday)
      .sort((a, b) => a.startMinute - b.startMinute)

    for (const range of ranges) {
      for (
        let minute = range.startMinute;
        minute + settings.slotDurationMin <= range.endMinute;
        minute += stepMin
      ) {
        const startAt = zonedTimeToUtc(
          dayParts.year,
          dayParts.month,
          dayParts.day,
          minute,
          timeZone,
        )

        if (
          !isLocalTimeValid(dayParts.year, dayParts.month, dayParts.day, minute, timeZone, startAt)
        ) {
          // несуществующее локальное время (переход на летнее время) — пропускаем
          continue
        }

        if (startAt < earliest) {
          continue
        }

        starts.push(new Date(startAt).toISOString())
      }
    }
  }

  return starts
}
