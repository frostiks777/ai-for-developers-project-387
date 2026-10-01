import { expect, test } from '@playwright/test'

const HOST = 'default'

interface Slot {
  startAt: string
  available: boolean
}

test('гость переносит, затем отменяет встречу по ссылке управления', async ({ page, request }) => {
  const eventTypes = (await (await request.get(`/api/v1/hosts/${HOST}/event-types`)).json()) as {
    id: string
  }[]
  expect(eventTypes.length).toBeGreaterThan(0)

  const { slots } = (await (await request.get(`/api/v1/hosts/${HOST}/slots`)).json()) as {
    slots: Slot[]
  }
  const free = slots.find((item) => item.available)
  expect(free).toBeDefined()

  const created = await request.post(`/api/v1/hosts/${HOST}/bookings`, {
    data: {
      eventTypeId: eventTypes[0].id,
      startAt: free?.startAt,
      clientName: 'Перенос E2E',
      clientEmail: 'manage@example.com',
      consentAccepted: true,
    },
  })
  expect(created.status()).toBe(201)
  const booking = (await created.json()) as { id: string }

  await page.goto(`/reschedule/${booking.id}`)
  await expect(page.getByRole('heading', { name: 'Перенести на другое время' })).toBeVisible()

  const newSlot = page.getByRole('button', { name: /^\d{2}:\d{2}$/ }).first()
  await expect(newSlot).toBeVisible()
  await newSlot.click()

  await page.getByRole('button', { name: 'Перенести встречу' }).click()
  await expect(page.getByRole('heading', { name: 'Встреча перенесена' })).toBeVisible()

  await page.reload()
  await page.getByRole('button', { name: 'Отменить встречу' }).click()
  await page.getByLabel('Причина отмены (необязательно)').fill('E2E: передумал')
  await page.getByRole('button', { name: 'Да, отменить' }).click()

  await expect(page.getByRole('heading', { name: 'Встреча отменена' })).toBeVisible()

  const after = (await (await request.get(`/api/v1/bookings/${booking.id}`)).json()) as {
    status: string
  }
  expect(after.status).toBe('cancelled')
})
