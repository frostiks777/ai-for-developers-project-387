import { useState } from 'react'
import { toast } from 'sonner'

import type { CreateBookingRequest } from '@/api/generated'
import { toCreatedBooking } from '@/api/mappers'
import { ApiError, api, call } from '@/api/sdk'
import type { CreatedBooking } from '@/types/booking'

export type BookSlotResult =
  | { ok: true; booking: CreatedBooking }
  | { ok: false; error: ApiError }

export function useBooking() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bookSlot = async (
    hostSlug: string,
    body: CreateBookingRequest,
    options?: { idempotencyKey?: string },
  ): Promise<BookSlotResult> => {
    setIsSubmitting(true)

    try {
      const booking = await call(
        api.hostBookingsClient.createBooking(hostSlug, body, {
          idempotencyKey: options?.idempotencyKey,
        }),
      )
      toast.success('Звонок забронирован')
      return { ok: true, booking: toCreatedBooking(booking) }
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError(0, 'Не удалось забронировать звонок')
      // 409 и 422 CAPTCHA_FAILED обрабатываются формой на месте (сообщение +
      // соседние окна / сброс виджета), дубль-тост не нужен
      if (apiError.status !== 409 && apiError.code !== 'CAPTCHA_FAILED') {
        toast.error(apiError.message)
      }
      return { ok: false, error: apiError }
    } finally {
      setIsSubmitting(false)
    }
  }

  return { isSubmitting, bookSlot }
}
