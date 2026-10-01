import { useEffect } from 'react'

import { useTurnstile } from '@/hooks/use-turnstile'
import { cn } from '@/lib/utils'

interface TurnstileFieldProps {
  // null, когда CAPTCHA выключена на сервере (нет TURNSTILE_SECRET_KEY)
  siteKey: string | null
  required: boolean
  // Сообщает токен наверх (в BookingForm) — он уходит в теле запроса.
  onTokenChange: (token: string | null) => void
  // Счётчик сброса; форма увеличивает его после неудачной отправки.
  resetSignal: number
  className?: string
}

// Обёртка над виджетом Cloudflare Turnstile. При required=false ничего не
// рендерит и не грузит скрипт — поэтому в dev/CI страница записи не зависит
// от внешнего сервиса (ADR-0025).
export function TurnstileField({
  siteKey,
  required,
  onTokenChange,
  resetSignal,
  className,
}: TurnstileFieldProps) {
  const { containerRef, token, hasError } = useTurnstile({
    siteKey,
    enabled: required,
    resetSignal,
  })

  useEffect(() => {
    if (!required) {
      return
    }

    onTokenChange(token)
  }, [required, token, onTokenChange])

  if (!required) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div ref={containerRef} data-testid="turnstile-widget" />
      {hasError ? (
        <p className="text-xs text-destructive" role="alert">
          Не удалось загрузить проверку защиты. Обновите страницу.
        </p>
      ) : null}
    </div>
  )
}
