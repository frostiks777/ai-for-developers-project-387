import { createHttpHeaders } from '@typespec/ts-http-runtime'
import type { HttpClient, PipelineRequest, PipelineResponse } from '@typespec/ts-http-runtime'

import { ApiV1Client } from '@/api/generated'
import type { ErrorResponse } from '@/api/generated'
import { RestError } from '@/api/generated/helpers/error.js'

// Транспорт поверх глобального fetch: одинаково работает в браузере и тестах,
// поэтому запросы можно перехватывать через vi.stubGlobal('fetch', ...).
const fetchHttpClient: HttpClient = {
  async sendRequest(request: PipelineRequest): Promise<PipelineResponse> {
    const headers: Record<string, string> = {}
    for (const [name, value] of request.headers) {
      headers[name] = value
    }

    const response = await fetch(request.url, {
      method: request.method,
      headers,
      body: typeof request.body === 'string' ? request.body : undefined,
      signal: request.abortSignal,
    })

    return {
      request,
      status: response.status,
      headers: createHttpHeaders(Object.fromEntries(response.headers)),
      bodyAsText: await response.text(),
    }
  },
}

// Единый клиент сгенерированного SDK. Абсолютный origin нужен рантайму
// @typespec/ts-http-runtime; в dev-режиме запросы уходят через Vite-proxy.
export const api = new ApiV1Client({
  endpoint: window.location.origin,
  // Локальная разработка и тесты идут по http
  allowInsecureConnection: true,
  httpClient: fetchHttpClient,
  // Не ретраим: падение запроса должно сообщаться сразу (как раньше)
  retryOptions: { maxRetries: 0 },
})

export class ApiError extends Error {
  readonly status: number
  // Машиночитаемый код из контракта (`{ error: { code } }`): например
  // CAPTCHA_FAILED. Без него форма не отличит отказ капчи от обычной
  // ошибки валидации — оба приходят как 422.
  readonly code: string | null

  constructor(status: number, message: string, code: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Достаёт человекочитаемое сообщение из тела ошибки: v1 `{ error: { message } }`
// либо легаси `{ error: 'текст' }`.
function messageFromBody(body: unknown): string | null {
  if (typeof body === 'string') {
    try {
      return messageFromBody(JSON.parse(body))
    } catch {
      return null
    }
  }

  if (body === null || typeof body !== 'object') {
    return null
  }

  const error = (body as { error?: unknown }).error

  if (typeof error === 'string' && error.trim() !== '') {
    return error
  }

  if (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }

  return null
}

// Достаёт машиночитаемый код ошибки из v1-конверта `{ error: { code } }`.
// Легаси-формат `{ error: 'текст' } }` кода не несёт.
function codeFromBody(body: unknown): string | null {
  const parsed = typeof body === 'string' ? safeParseJson(body) : body

  if (parsed === null || typeof parsed !== 'object') {
    return null
  }

  const error = (parsed as { error?: unknown }).error

  if (error !== null && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code
    return typeof code === 'string' && code.trim() !== '' ? code : null
  }

  return null
}

function safeParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

// Разворачивает результат SDK-операции: на успех возвращает модель,
// на ошибку — ApiError с сообщением и кодом из ответа.
export async function call<T>(promise: Promise<T | ErrorResponse>): Promise<T> {
  try {
    return (await promise) as T
  } catch (error) {
    if (error instanceof RestError) {
      const message = messageFromBody(error.body) ?? `Ошибка запроса: ${error.status}`
      throw new ApiError(Number(error.status), message, codeFromBody(error.body))
    }

    throw error
  }
}
