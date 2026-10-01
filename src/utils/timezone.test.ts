import { describe, expect, it } from 'vitest'

import {
  formatDateTimeInZone,
  formatWeekdayShort,
  formatZoneShort,
  searchTimeZones,
  toDateKeyInZone,
} from './timezone'

describe('toDateKeyInZone', () => {
  it('возвращает дату в UTC', () => {
    expect(toDateKeyInZone(new Date('2026-09-23T22:00:00.000Z'), 'UTC')).toBe('2026-09-23')
  })

  it('учитывает сдвиг часового пояса', () => {
    expect(toDateKeyInZone(new Date('2026-09-23T22:00:00.000Z'), 'Europe/Moscow')).toBe(
      '2026-09-24',
    )
  })
})

describe('formatDateTimeInZone', () => {
  it('показывает время в выбранном поясе', () => {
    expect(formatDateTimeInZone('2026-09-24T07:00:00.000Z', 'UTC')).toContain('07:00')
  })

  it('пересчитывает время при другом поясе', () => {
    expect(formatDateTimeInZone('2026-09-24T07:00:00.000Z', 'Europe/Moscow')).toContain('10:00')
  })

  it('без hour12 использует 24-часовой формат', () => {
    expect(formatDateTimeInZone('2026-09-24T19:00:00.000Z', 'UTC')).toContain('19:00')
  })
})

describe('formatWeekdayShort', () => {
  it('возвращает сокращённый день недели, не завися от TZ процесса', () => {
    expect(formatWeekdayShort('2026-09-28')).toBe('Пн')
  })

  it('воскресенье — Вс', () => {
    expect(formatWeekdayShort('2026-09-27')).toBe('Вс')
  })
})

describe('formatZoneShort', () => {
  it('пояс с предложным падежом', () => {
    expect(formatZoneShort('Europe/Moscow')).toBe('по Москве (UTC+3)')
  })

  it('UTC', () => {
    expect(formatZoneShort('UTC')).toBe('по UTC (UTC+0)')
  })

  it('неизвестный пояс — по IANA', () => {
    expect(formatZoneShort('Asia/Tokyo')).toContain('Asia/Tokyo')
  })
})

describe('searchTimeZones', () => {
  it('без запроса отдаёт популярные пояса', () => {
    const options = searchTimeZones('')

    expect(options).toContain('UTC')
    expect(options).toContain('Europe/Moscow')
  })

  it('фильтрует по подстроке', () => {
    const options = searchTimeZones('berlin')

    expect(options).toContain('Europe/Berlin')
    expect(options).not.toContain('Europe/Moscow')
  })

  it('возвращает пустой список без совпадений', () => {
    expect(searchTimeZones('not-a-timezone')).toEqual([])
  })
})