import { env } from './env'

// Cloudflare Turnstile (ADR-0025). Единственная точка включения капчи:
// пока TURNSTILE_SECRET_KEY не задан, CAPTCHA выключена и ни форма, ни сервер
// не обращаются к Cloudflare. Это делает локальный dev, npm test и Playwright-e2e
// в CI полностью независимыми от внешнего сервиса.
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const VERIFY_TIMEOUT_MS = 5_000

export const isCaptchaEnabled = (): boolean => Boolean(env.TURNSTILE_SECRET_KEY)

// Публичный site key для виджета; null, если капча выключена.
export const captchaSiteKey = (): string | null => env.TURNSTILE_SITEKEY ?? null

// Сверка hostname защищает от использования нашего секрета на чужом домене.
// С dummy-ключами Cloudflare возвращает "localhost", поэтому сверка идёт только
// когда в системе реальный (не тестовый) секрет.
const REAL_SECRET_PREFIX = '0x4AAAA'

const isRealSecret = (secret: string): boolean => secret.startsWith(REAL_SECRET_PREFIX)

export type CaptchaResult = { ok: true } | { ok: false; reason: string }

const pass = (): CaptchaResult => ({ ok: true })
const fail = (reason: string): CaptchaResult => ({ ok: false, reason })

// Проверка одноразового токена виджета через Siteverify API.
// Fail-closed: недоступность Cloudflare и невалидный ответ считаются провалом —
// иначе кратковременный сбой внешнего сервиса открыл бы ботнет.
export const verifyCaptchaToken = async (
  token: string | undefined,
  remoteIp: string | undefined,
  idempotencyKey?: string,
): Promise<CaptchaResult> => {
  if (!isCaptchaEnabled()) {
    return pass()
  }

  if (!token) {
    return fail('Подтвердите, что вы не робот')
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY as string,
    response: token,
  })

  // remoteip усиливает проверку: токен должен быть выдан с того же адреса.
  if (remoteIp) {
    body.set('remoteip', remoteIp)
  }
  // Защита от повторного использования одного токена с разными idempotency-ключами.
  if (idempotencyKey) {
    body.set('idempotency_key', idempotencyKey)
  }

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    })

    if (!response.ok) {
      return fail('Проверка защиты временно недоступна, попробуйте позже')
    }

    const result = (await response.json()) as {
      success?: boolean
      hostname?: string
      'error-codes'?: string[]
    }

    if (!result.success) {
      return fail('Подтвердите, что вы не робот')
    }

    if (isRealSecret(env.TURNSTILE_SECRET_KEY as string) && result.hostname) {
      const allowed = (env.TURNSTILE_ALLOWED_HOSTNAMES ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

      if (allowed.length > 0 && !allowed.includes(result.hostname)) {
        return fail('Проверка защиты не пройдена')
      }
    }

    return pass()
  } catch {
    return fail('Проверка защиты временно недоступна, попробуйте позже')
  }
}
