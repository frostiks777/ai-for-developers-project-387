import type { FastifyRequest } from 'fastify'
import type { RateLimitOptions } from '@fastify/rate-limit'

import { env } from './env'

// Rate-limit по IP для публичных операций брони (ADR-0025).
// Счётчики живут в памяти процесса (in-memory LRU плагина): Render free —
// один инстанс, поэтому внешний store (Redis/Upstash) не нужен.
// Известные ограничения: после холодного старта Render счётчики обнуляются,
// а при нескольких инстансах лимит нужно делить — см. ADR-0025.
//
// Лимиты читаются из env лениво (при вызове), а не на уровне модуля: так тесты
// могут задать свои значения до buildApp(), не меняя боевые дефолты.

const MINUTE = 60_000

/**
 * Лимит на создание брони. 20/мин — заведомо выше ручной частоты проверки
 * в dev и при переборе вариантов времени, но не даёт залить слоты пачкой.
 */
export const bookingRateLimit = (): RateLimitOptions => ({
  max: env.RATE_LIMIT_BOOKING_MAX,
  timeWindow: MINUTE,
})

/**
 * Отмена и перенос: токен гостя одноразовый, но эндпоинты публичные.
 */
export const mutationRateLimit = (): RateLimitOptions => ({
  max: env.RATE_LIMIT_BOOKING_MAX,
  timeWindow: MINUTE,
})

/**
 * Публичные чтения: страница записи делает несколько запросов за визит,
 * поэтому лимит щедрый — цель не помешать гостю, а отсечь скрейпинг слотов.
 */
export const publicReadRateLimit = (): RateLimitOptions => ({
  max: env.RATE_LIMIT_READ_MAX,
  timeWindow: MINUTE,
})

/**
 * Общий предохранитель на все маршруты: ловит перебор URL и 404-сканеры.
 */
export const globalRateLimit = (): RateLimitOptions => ({
  max: env.RATE_LIMIT_GLOBAL_MAX,
  timeWindow: MINUTE,
})

/**
 * Ключ rate-limit — реальный IP гостя.
 *
 * На Render цепочка такая: гость → Cloudflare → Render-proxy, и Cloudflare
 * перезаписывает CF-Connecting-IP настоящим адресом клиента (клиентское
 * значение заголовка не проходит). Поэтому берём этот заголовок, а если его
 * нет — request.ip, который при trustProxy:true тоже указывает на клиента
 * (левый элемент X-Forwarded-For, тоже записанный Cloudflare).
 * В локальной разработке заголовков нет, и ключом становится адрес сокета.
 *
 * Почему не подбор «числа доверенных прокси»: proxy-addr дописывает адрес
 * сокета к X-Forwarded-For, поэтому фактическая глубина цепочки на Render —
 * 3 хопа, а не 2, и любая жёстко заданная цифра молча ломает лимит.
 */
export const clientIpKey = (request: FastifyRequest): string => {
  const cfIp = request.headers['cf-connecting-ip']

  if (typeof cfIp === 'string' && cfIp.trim() !== '') {
    return cfIp.trim()
  }

  return request.ip
}

/**
 * Тело ответа 429 в общем конверте ошибок API v1 ({ error: { code, message } }).
 */
export const rateLimitErrorResponse = (
  _request: FastifyRequest,
  context: { after: string },
) => ({
  statusCode: 429,
  error: {
    code: 'RATE_LIMITED',
    message: `Слишком много запросов. Повторите через ${context.after} с.`,
  },
})
