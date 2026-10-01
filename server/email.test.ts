// @vitest-environment node
import { appOrigin, isEmailEnabled, sendEmail } from './email'
import { env } from './env'

type FetchCall = [string, { method: string; headers: Record<string, string>; body: string }]

let original: {
  key: string | undefined
  from: string | undefined
  replyTo: string | undefined
  appOrigin: string | undefined
  renderUrl: string | undefined
}
let fetchMock: ReturnType<typeof vi.fn>

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const message = {
  to: 'guest@example.com',
  subject: 'Тема письма',
  text: 'Текст',
  html: '<p>Текст</p>',
}

beforeEach(() => {
  original = {
    key: env.EMAIL_API_KEY,
    from: env.EMAIL_FROM,
    replyTo: env.EMAIL_REPLY_TO,
    appOrigin: env.APP_ORIGIN,
    renderUrl: env.RENDER_EXTERNAL_URL,
  }

  fetchMock = vi.fn(async () => json({ messageId: '1' }, 201))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  env.EMAIL_API_KEY = original.key
  env.EMAIL_FROM = original.from
  env.EMAIL_REPLY_TO = original.replyTo
  env.APP_ORIGIN = original.appOrigin
  env.RENDER_EXTERNAL_URL = original.renderUrl
  vi.unstubAllGlobals()
})

describe('email выключен без ключа', () => {
  it('no-op и не обращается к сети', async () => {
    env.EMAIL_API_KEY = undefined

    expect(isEmailEnabled()).toBe(false)
    expect(await sendEmail(message)).toEqual({ ok: true, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('email через Brevo HTTP API', () => {
  beforeEach(() => {
    env.EMAIL_API_KEY = 'test-key'
    env.EMAIL_FROM = 'Календарь звонков <sender@example.com>'
    env.EMAIL_REPLY_TO = 'host@example.com'
  })

  it('отправляет письмо с api-key, отправителем и reply-to', async () => {
    expect(await sendEmail(message)).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as FetchCall

    expect(url).toBe('https://api.brevo.com/v3/smtp/email')
    expect(init.method).toBe('POST')
    expect(init.headers['api-key']).toBe('test-key')

    const body = JSON.parse(init.body) as Record<string, unknown>

    expect(body.sender).toEqual({ name: 'Календарь звонков', email: 'sender@example.com' })
    expect(body.to).toEqual([{ email: 'guest@example.com' }])
    expect(body.replyTo).toEqual({ email: 'host@example.com' })
    expect(body.subject).toBe('Тема письма')
    expect(body.htmlContent).toBe('<p>Текст</p>')
    expect(body.textContent).toBe('Текст')
  })

  it('ошибка провайдера не бросает исключение', async () => {
    fetchMock.mockResolvedValueOnce(json({ message: 'bad key' }, 401))

    const result = await sendEmail(message)

    expect(result.ok).toBe(false)
  })

  it('сетевой сбой не бросает исключение', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'))

    const result = await sendEmail(message)

    expect(result.ok).toBe(false)
  })
})

describe('appOrigin', () => {
  it('приоритет: APP_ORIGIN → RENDER_EXTERNAL_URL → localhost', () => {
    env.APP_ORIGIN = 'https://app.example.com'
    env.RENDER_EXTERNAL_URL = 'https://render.example.com'
    expect(appOrigin()).toBe('https://app.example.com')

    env.APP_ORIGIN = undefined
    expect(appOrigin()).toBe('https://render.example.com')

    env.RENDER_EXTERNAL_URL = undefined
    expect(appOrigin()).toBe(`http://localhost:${env.PORT}`)
  })
})
