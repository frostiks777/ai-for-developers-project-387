// Хелперы для моков fetch в тестах.

// Сгенерированный SDK обращается к API абсолютным URL — приводим к пути запроса.
export function requestPath(input: RequestInfo | URL): string {
  const raw = input instanceof Request ? input.url : String(input)

  try {
    const url = new URL(raw, 'http://localhost')
    return `${url.pathname}${url.search}`
  } catch {
    return raw
  }
}

// SDK принимает ответ только с application/json — явно выставляем заголовок.
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
