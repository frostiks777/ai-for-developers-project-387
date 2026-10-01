// Хосты (мульти-хост). MVP заводит одного дефолтного организатора,
// эндпоинты /api/v1/hosts/:slug/* читают его из таблицы hosts.

export interface Host {
  id: string
  slug: string
  name: string
  timezone: string
  createdAt: string
}

// Данные дефолтного хоста для сидирования
export const defaultHost = {
  slug: 'default',
  name: 'Организатор',
  timezone: 'UTC',
}

// Проверка IANA-пояса: Intl бросит RangeError на неизвестном значении
export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())

    return true
  } catch {
    return false
  }
}

// Ключ дня (YYYY-MM-DD) для ISO-времени в заданном поясе
export function dateKeyInZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

// Формат даты, который принимает ?date= в API v1
export const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/
