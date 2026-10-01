import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Calendar, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SlotSuggestions } from '@/components/slot-suggestions'
import { TurnstileField } from '@/components/turnstile-field'
import { Textarea } from '@/components/ui/textarea'
import { useBooking } from '@/hooks/use-booking'
import { useTimeFormat } from '@/hooks/use-time-format'
import { createBookingSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'
import type { CreatedBooking, TimeSlot } from '@/types/booking'
import { formatPhoneInput } from '@/utils/phone'
import {
  formatDayShortTitle,
  formatTimeInZone,
  formatTimeRange,
  formatZoneShort,
  toDateKeyInZone,
} from '@/utils/timezone'

interface BookingFormProps {
  slot: TimeSlot | null
  hostSlug: string
  eventTypeId: string | null
  eventTypeTitle?: string | null
  timeZone: string
  variant?: 'column' | 'step'
  suggestions?: TimeSlot[]
  onSelectSuggestion?: (slot: TimeSlot) => void
  onBooked: (booking: CreatedBooking) => void
  onConflict: (slot: TimeSlot) => void
  // Параметры CAPTCHA из GET /hosts/:slug/settings (ADR-0025).
  // При required=false виджет не рендерится и токен не отправляется.
  captchaRequired?: boolean
  captchaSiteKey?: string | null
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `idem-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function joinRu(items: string[]): string {
  if (items.length <= 1) {
    return items.join('')
  }

  return `${items.slice(0, -1).join(', ')} и ${items[items.length - 1]}`
}

export function BookingForm({
  slot,
  hostSlug,
  eventTypeId,
  eventTypeTitle,
  timeZone,
  variant = 'column',
  suggestions = [],
  onSelectSuggestion,
  onBooked,
  onConflict,
  captchaRequired = false,
  captchaSiteKey = null,
}: BookingFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [guests, setGuests] = useState<string[]>([])
  const [guestInput, setGuestInput] = useState('')
  const [guestError, setGuestError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [isExtraOpen, setIsExtraOpen] = useState(false)
  const [conflict, setConflict] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(() => createIdempotencyKey())
  // CAPTCHA (ADR-0025): токен приходит из виджета, resetSignal заставляет
  // виджет выдать новый токен после отказа сервера.
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [captchaReset, setCaptchaReset] = useState(0)
  const { isSubmitting, bookSlot } = useBooking()
  const { hour12 } = useTimeFormat()
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Новый ключ идемпотентности на каждый выбранный слот (поля не сбрасываем)
  useEffect(() => {
    setIdempotencyKey(createIdempotencyKey())
    setConflict(false)
  }, [slot?.id])

  const addGuest = () => {
    const value = guestInput.trim()

    if (value === '') {
      return
    }

    if (!EMAIL_PATTERN.test(value)) {
      setGuestError('Неверный email гостя')
      return
    }

    if (!guests.includes(value)) {
      setGuests((prev) => [...prev, value])
    }

    setGuestInput('')
    setGuestError(null)
  }

  const parseResult = createBookingSchema.safeParse({
    slotId: slot?.id ?? 0,
    name,
    phone,
    email,
    comment,
    guests,
    consentAccepted: consent,
    captchaToken: captchaToken ?? undefined,
  })
  // CAPTCHA включена на сервере, но гость ещё не прошёл виджет — отправка
  // заблокирована, иначе сервер вернул бы 422 CAPTCHA_FAILED.
  const captchaSatisfied = !captchaRequired || Boolean(captchaToken)
  const isFormValid =
    parseResult.success && slot !== null && eventTypeId !== null && captchaSatisfied
  const issues = parseResult.success ? [] : parseResult.error.issues
  const nameError =
    name.trim() !== '' ? (issues.find((issue) => issue.path[0] === 'name')?.message ?? null) : null
  const phoneError =
    phone.trim() !== '' ? (issues.find((issue) => issue.path[0] === 'phone')?.message ?? null) : null
  const emailError =
    email.trim() !== '' ? (issues.find((issue) => issue.path[0] === 'email')?.message ?? null) : null

  const missing: string[] = []
  if (name.trim() === '' || nameError !== null) {
    missing.push('заполните имя')
  }
  if (email.trim() === '' || emailError !== null) {
    missing.push('укажите email')
  }
  if (!consent) {
    missing.push('отметьте согласие')
  }
  if (!captchaSatisfied) {
    missing.push('подтвердите, что вы не робот')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!slot || !eventTypeId || !isFormValid) {
      return
    }

    setConflict(false)
    setCaptchaError(null)

    const result = await bookSlot(
      hostSlug,
      {
        eventTypeId,
        startAt: slot.startAt,
        clientName: name,
        clientEmail: email,
        clientPhone: phone.trim() || undefined,
        clientNotes: comment.trim() || undefined,
        guests: guests.length > 0 ? guests : undefined,
        consentAccepted: consent,
        captchaToken: captchaToken ?? undefined,
      },
      { idempotencyKey },
    )

    if (result.ok) {
      onBooked(result.booking)
      setName('')
      setPhone('')
      setEmail('')
      setComment('')
      setGuests([])
      setGuestInput('')
      setGuestError(null)
      setConsent(false)
      setIsExtraOpen(false)
      setIdempotencyKey(createIdempotencyKey())
      return
    }

    if (result.error.status === 409) {
      setConflict(true)
      onConflict(slot)
    }

    // Токен одноразовый: после отказа сервера виджет должен выдать новый,
    // иначе повторная отправка получит тот же израсходованный токен.
    if (result.error.code === 'CAPTCHA_FAILED') {
      setCaptchaError(result.error.message)
      setCaptchaReset((signal) => signal + 1)
    }
  }

  const dateKey = slot ? toDateKeyInZone(new Date(slot.startAt), timeZone) : null
  const summaryTitle =
    slot && dateKey ? `${formatDayShortTitle(dateKey)}, ${formatTimeRange(slot, timeZone, hour12)}` : ''
  const summarySubtitle = `${eventTypeTitle ?? 'Встреча'} · ${formatZoneShort(timeZone)}`
  const isStep = variant === 'step'
  const inputClass = isStep ? 'h-[52px] text-base' : 'h-11'
  const buttonLabel = slot
    ? `Записаться на ${formatTimeInZone(slot.startAt, timeZone, hour12)}`
    : 'Выберите время'

  return (
    <section className="flex h-full min-w-0 flex-col">
      <h2 className="text-lg font-semibold">Ваши данные</h2>

      <div
        className={cn(
          'mt-3 rounded-xl p-3',
          slot ? 'bg-accent' : 'border border-dashed border-input',
        )}
      >
        {slot ? (
          <>
            <p className="text-[15px] font-bold text-accent-foreground">{summaryTitle}</p>
            <p className="mt-0.5 text-[13px] text-accent-foreground/80">{summarySubtitle}</p>
          </>
        ) : (
          <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Calendar className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" />
            Выберите день и время слева
          </p>
        )}
      </div>

      {conflict && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-highlight/40 bg-highlight/15 px-3 py-2 text-[13px]"
        >
          <p>
            <strong>Это время только что заняли.</strong> Выберите соседнее — ваши имя и email
            сохранены.
          </p>
          <SlotSuggestions
            slots={suggestions}
            timeZone={timeZone}
            onSelect={(slot) => {
              setConflict(false)
              onSelectSuggestion?.(slot)
            }}
          />
        </div>
      )}

      <form aria-label="Ваши данные" className="mt-4 flex min-h-0 flex-1 flex-col gap-3" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="booking-name">Имя</Label>
          <Input
            ref={nameInputRef}
            id="booking-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Как к вам обращаться"
            autoComplete="name"
            aria-invalid={nameError !== null}
            aria-describedby={nameError ? 'booking-name-error' : undefined}
            className={cn(inputClass, nameError && 'border-destructive')}
          />
          {nameError && (
            <p id="booking-name-error" className="text-[13px] text-destructive">
              {nameError}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="booking-email">Email</Label>
          <Input
            id="booking-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={emailError !== null}
            aria-describedby={emailError ? 'booking-email-error' : undefined}
            className={cn(inputClass, emailError && 'border-destructive')}
          />
          {emailError ? (
            <p id="booking-email-error" className="text-[13px] text-destructive">
              {emailError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Нужен, чтобы вы могли найти встречу позже
            </p>
          )}
        </div>

        <button
          type="button"
          aria-expanded={isExtraOpen}
          aria-controls="booking-extra-fields"
          onClick={() => setIsExtraOpen((open) => !open)}
          className={cn(
            'flex items-center gap-1.5 rounded-xl border border-dashed border-input px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isStep ? 'h-[52px]' : 'h-11',
          )}
        >
          + {isStep ? 'Добавить телефон или вопрос к встрече' : 'Телефон, комментарий, гости'}
        </button>

        <div
          id="booking-extra-fields"
          className={cn('grid gap-3', !isExtraOpen && 'hidden')}
        >
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-phone">Телефон</Label>
              <span className="text-xs text-muted-foreground">необязательно</span>
            </div>
            <Input
              id="booking-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
              placeholder="+7 900 000-00-00"
              autoComplete="tel"
              aria-invalid={phoneError !== null}
              aria-describedby={phoneError ? 'booking-phone-error' : undefined}
              className={cn(inputClass, phoneError && 'border-destructive')}
            />
            {phoneError && (
              <p id="booking-phone-error" className="text-[13px] text-destructive">
                {phoneError}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-comment">Комментарий</Label>
              <span className="text-xs text-muted-foreground">необязательно</span>
            </div>
            <Textarea
              id="booking-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Вопрос или тема встречи (необязательно)"
              rows={3}
              maxLength={500}
              aria-describedby="booking-comment-counter"
              className={cn(inputClass, 'min-h-[80px] py-2.5')}
            />
            <div className="flex justify-end">
              <span id="booking-comment-counter" className="text-xs text-muted-foreground">
                {comment.length} / 500
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking-guests">Гости</Label>
              <span className="text-xs text-muted-foreground">необязательно</span>
            </div>
            {guests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {guests.map((guest) => (
                  <span
                    key={guest}
                    className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[13px] text-accent-foreground"
                  >
                    {guest}
                    <button
                      type="button"
                      aria-label={`Убрать гостя: ${guest}`}
                      onClick={() => setGuests((prev) => prev.filter((item) => item !== guest))}
                      className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Input
              id="booking-guests"
              type="email"
              value={guestInput}
              onChange={(event) => setGuestInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addGuest()
                }
              }}
              onBlur={addGuest}
              placeholder="Email гостя и Enter"
              aria-invalid={guestError !== null}
              aria-describedby={guestError ? 'booking-guests-error' : undefined}
              className={cn(inputClass, guestError && 'border-destructive')}
            />
            {guestError && (
              <p id="booking-guests-error" className="text-[13px] text-destructive">
                {guestError}
              </p>
            )}
          </div>
        </div>

        <label className="flex items-start gap-2 text-[13px] text-muted-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            aria-label="Согласие на обработку персональных данных"
            className="mt-0.5 size-5 shrink-0 rounded border-input"
          />
          <span>Согласен на обработку персональных данных для этой встречи</span>
        </label>

        {!eventTypeId && (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2 text-[13px] text-destructive">
            Для этого организатора не настроены типы встреч — бронирование недоступно.
          </p>
        )}

        {captchaRequired && (
          <div className="space-y-1">
            <TurnstileField
              siteKey={captchaSiteKey}
              required={captchaRequired}
              onTokenChange={setCaptchaToken}
              resetSignal={captchaReset}
            />
            {captchaError && (
              <p role="alert" className="text-[13px] text-destructive">
                {captchaError}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto pt-3">
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            aria-describedby={!isFormValid ? 'booking-submit-hint' : undefined}
            className={cn(
              'w-full bg-highlight text-highlight-foreground shadow-glow-lg hover:bg-highlight/90',
              isStep ? 'h-14 rounded-[14px] text-[17px]' : 'h-[52px] rounded-xl text-base',
            )}
          >
            {isSubmitting ? 'Отправка…' : buttonLabel}
          </Button>
          {!isFormValid && missing.length > 0 && (
            <p id="booking-submit-hint" className="mt-2 text-center text-xs text-muted-foreground">
              Чтобы записаться, {joinRu(missing)}
            </p>
          )}
          {isStep && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Сохраним встречу на этом телефоне в «Мои встречи»
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
