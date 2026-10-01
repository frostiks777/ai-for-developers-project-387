import { useEffect, useRef, useState } from 'react'

// Клиентская интеграция Cloudflare Turnstile без внешних зависимостей (ADR-0025).
// Скрипт подгружается с challenges.cloudflare.com с render=explicit, поэтому
// виджет создаём сами — нам нужен доступ к одноразовому токену и к reset().

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string
      callback: (token: string) => void
      'expired-callback'?: () => void
      'error-callback'?: () => void
      theme?: 'light' | 'dark' | 'auto'
    },
  ) => string
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

// Промис-кэш: скрипт не должен грузиться повторно при смене слота или
// перерисовке шага мастера.
let scriptPromise: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null

    const onReady = () => {
      if (window.turnstile) {
        resolve(window.turnstile)
      } else {
        scriptPromise = null
        reject(new Error('Turnstile загрузился без window.turnstile'))
      }
    }

    const script = existing ?? document.createElement('script')

    script.addEventListener('load', onReady)
    script.addEventListener('error', () => {
      scriptPromise = null
      reject(new Error('Не удалось загрузить скрипт Turnstile'))
    })

    if (!existing) {
      script.id = SCRIPT_ID
      script.src = SCRIPT_SRC
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  })

  return scriptPromise
}

export type TurnstileState = {
  /** Контейнер, который нужно навесить на DOM-узел виджета. */
  containerRef: (node: HTMLDivElement | null) => void
  token: string | null
  isReady: boolean
  hasError: boolean
}

type UseTurnstileOptions = {
  siteKey: string | null
  enabled: boolean
  /**
   * Счётчик сброса. Форма увеличивает его после неудачной отправки, чтобы
   * виджет выдал новый токен: предыдущий уже израсходован и повторно
   * не пройдёт (Cloudflare отвечает timeout-or-duplicate).
   */
  resetSignal: number
}

export function useTurnstile({
  siteKey,
  enabled,
  resetSignal,
}: UseTurnstileOptions): TurnstileState {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!enabled || !siteKey || !node) {
      return
    }

    let isActive = true

    void loadTurnstile()
      .then((api) => {
        if (!isActive) {
          return
        }

        widgetIdRef.current = api.render(node, {
          sitekey: siteKey,
          callback: (value) => {
            setToken(value)
            setHasError(false)
          },
          'expired-callback': () => setToken(null),
          'error-callback': () => {
            setToken(null)
            setHasError(true)
          },
          theme: 'auto',
        })
        setIsReady(true)
      })
      .catch(() => {
        if (isActive) {
          setHasError(true)
        }
      })

    return () => {
      isActive = false

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }

      widgetIdRef.current = null
      setIsReady(false)
    }
  }, [enabled, siteKey, node])

  const appliedReset = useRef(resetSignal)

  useEffect(() => {
    if (resetSignal === appliedReset.current) {
      return
    }

    appliedReset.current = resetSignal
    setToken(null)

    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [resetSignal])

  return { containerRef: setNode, token, isReady, hasError }
}
