import { renderHook, waitFor } from '@testing-library/react'

import { useAvailability } from './use-availability'
import type { TimeSlot } from '@/types/booking'

const pastSlot: TimeSlot = {
  id: 1,
  startAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  durationMin: 30,
  isBooked: false,
}

const futureSlot: TimeSlot = {
  id: 2,
  startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMin: 30,
  isBooked: false,
}

function stubSlotsResponse(slots: TimeSlot[], status = 200) {
  const body = {
    timeZone: 'UTC',
    date: null,
    slots: slots.map((item) => ({
      id: item.id,
      startAt: item.startAt,
      durationMin: item.durationMin,
      available: !item.isBooked,
    })),
  }

  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'Content-Type': 'application/json' },
        }),
    ),
  )
}

describe('useAvailability', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('отбрасывает прошедшие слоты', async () => {
    stubSlotsResponse([pastSlot, futureSlot])

    const { result } = renderHook(() => useAvailability('default'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.slots).toEqual([futureSlot])
    expect(result.current.error).toBeNull()
  })

  it('показывает ошибку при неудачном запросе', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ error: 'Внутренняя ошибка' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
      ),
    )

    const { result } = renderHook(() => useAvailability('default'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('Не удалось загрузить слоты')
    expect(result.current.slots).toEqual([])
  })
})

