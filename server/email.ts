import { env } from './env'

// Brevo HTTP API (ADR-0026). Единственная точка включения писем: пока
// EMAIL_API_KEY не задан, отправка — no-op, и ни dev, ни npm test, ни e2e
// не обращаются к внешнему сервису. На Render Free исходящий SMTP заблокирован
// (порты 25/465/587), поэтому используется только HTTP API.
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const SEND_TIMEOUT_MS = 10_000

export interface EmailMessage {
  to: string
  subject: string
  text: string
  html: string
}

export type SendEmailResult = { ok: true; skipped?: boolean } | { ok: false; error: string }

export const isEmailEnabled = (): boolean => Boolean(env.EMAIL_API_KEY)

// Базовый origin для абсолютных ссылок в письмах.
export const appOrigin = (): string =>
  env.APP_ORIGIN ?? env.RENDER_EXTERNAL_URL ?? `http://localhost:${env.PORT}`

// "Имя <email@example.com>" → { name, email }; простая строка — только email.
const parseSender = (from: string): { name?: string; email: string } => {
  const match = from.match(/^\s*(.*?)\s*<\s*([^>]+?)\s*>\s*$/)

  if (match) {
    return { name: match[1] || undefined, email: match[2] }
  }

  return { email: from.trim() }
}

// Ошибка отправки никогда не бросается наружу: письмо не должно ломать бронь.
export const sendEmail = async (message: EmailMessage): Promise<SendEmailResult> => {
  if (!isEmailEnabled()) {
    return { ok: true, skipped: true }
  }

  if (!env.EMAIL_FROM) {
    return { ok: false, error: 'EMAIL_FROM не задан' }
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': env.EMAIL_API_KEY as string,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: parseSender(env.EMAIL_FROM),
        to: [{ email: message.to }],
        ...(env.EMAIL_REPLY_TO ? { replyTo: { email: env.EMAIL_REPLY_TO } } : {}),
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })

    if (!response.ok) {
      return { ok: false, error: `Brevo API ${response.status}` }
    }

    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'unknown error' }
  }
}
