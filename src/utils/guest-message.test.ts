import { buildGuestMessage } from './guest-message'

describe('buildGuestMessage', () => {
  it('собирает текст об отмене встречи со ссылкой на запись', () => {
    const message = buildGuestMessage(
      {
        name: 'Иван',
        eventTypeTitle: 'Звонок-консультация',
        startAt: '2026-09-28T11:20:00.000Z',
      },
      { hostSlug: 'default', timeZone: 'Europe/Moscow', origin: 'https://example.com' },
    )

    expect(message).toContain('Здравствуйте, Иван!')
    expect(message).toContain('«Звонок-консультация»')
    expect(message).toContain('14:20')
    expect(message).toContain('по Москве (UTC+3)')
    expect(message).toContain('https://example.com/book/default')
  })
})
