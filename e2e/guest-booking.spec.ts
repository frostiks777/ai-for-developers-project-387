import { expect, test } from '@playwright/test'

const HOST = 'default'

interface Slot {
  startAt: string
  available: boolean
}

interface Booking {
  id: string
  startAt: string
}

test('гость проходит сквозной сценарий: тип → слот → форма → подтверждение', async ({ page }) => {
  await page.goto(`/book/${HOST}`)

  // Время за гостя не выбирается: кликаем по первому свободному слоту
  const slot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
  await expect(slot).toBeVisible()
  await slot.click()

  const form = page.getByRole('form', { name: 'Ваши данные' })
  await form.getByLabel('Имя').fill('Гость E2E')
  await form.getByLabel('Email').fill('guest@example.com')
  await form.getByLabel('Согласие на обработку персональных данных').check()
  await form.getByRole('button', { name: /^Записаться на/ }).click()

  await expect(page.getByRole('heading', { name: 'Встреча успешно запланирована!' })).toBeVisible()
  await expect(page.getByText('Гость E2E')).toBeVisible()
  await expect(page.getByText('guest@example.com')).toBeVisible()
})

test('повторная бронь занятого слота отклоняется, в том числе другим типом', async ({ request }) => {
  const eventTypes = (await (await request.get(`/api/v1/hosts/${HOST}/event-types`)).json()) as {
    id: string
  }[]
  expect(eventTypes.length).toBeGreaterThan(0)

  const day = (await (await request.get(`/api/v1/hosts/${HOST}/slots`)).json()) as {
    slots: Slot[]
  }
  const slot = day.slots.find((item) => item.available)
  expect(slot).toBeDefined()

  const payload = {
    eventTypeId: eventTypes[0].id,
    startAt: slot?.startAt,
    clientName: 'Конфликт E2E',
    clientEmail: 'conflict@example.com',
    consentAccepted: true,
  }

  const first = await request.post(`/api/v1/hosts/${HOST}/bookings`, { data: payload })
  expect(first.status()).toBe(201)
  await first.json<Booking>()

  const again = await request.post(`/api/v1/hosts/${HOST}/bookings`, { data: payload })
  expect(again.status()).toBe(409)
  expect((await again.json()).error.code).toBe('SLOT_TAKEN')

  // Второй тип встречи на тот же слот тоже не проходит
  const otherType = await request.post(`/api/v1/hosts/${HOST}/event-types`, {
    data: {
      slug: `e2e-${Date.now()}`,
      title: 'E2E тип',
      durationMin: 30,
      locationType: 'online',
    },
  })
  expect(otherType.status()).toBe(201)
  const otherTypeId = ((await otherType.json()) as { id: string }).id

  const conflict = await request.post(`/api/v1/hosts/${HOST}/bookings`, {
    data: { ...payload, eventTypeId: otherTypeId },
  })
  expect(conflict.status()).toBe(409)
  expect((await conflict.json()).error.code).toBe('SLOT_TAKEN')
})
