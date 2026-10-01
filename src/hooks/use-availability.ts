import { useCallback, useEffect, useState } from 'react'

import { toTimeSlot } from '@/api/mappers'
import { api, call } from '@/api/sdk'
import type { TimeSlot } from '@/types/booking'

export function useAvailability(slug: string, eventTypeId?: string) {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSlots = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await call(api.listSlots(slug, { eventTypeId }))
      // Бэкенд тоже фильтрует, но вкладка могла быть открыта долго — не показываем прошедшее
      setSlots(
        data.slots.map(toTimeSlot).filter((slot) => new Date(slot.startAt).getTime() >= Date.now()),
      )
      setError(null)
    } catch {
      setError('Не удалось загрузить слоты')
    } finally {
      setIsLoading(false)
    }
  }, [slug, eventTypeId])

  useEffect(() => {
    void loadSlots()
  }, [loadSlots])

  return { slots, isLoading, error, refetch: loadSlots }
}
