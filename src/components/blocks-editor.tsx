import { useCallback, useEffect, useState } from 'react'
import { CalendarOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import type { TimeBlock } from '@/api/generated'
import { ApiError, api, call } from '@/api/sdk'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TimeBlockFormValue } from '@/lib/validation'
import { timeBlockFormSchema } from '@/lib/validation'
import { cn } from '@/lib/utils'
import { defaultTimeZone, formatDateTimeInZone } from '@/utils/timezone'

interface BlocksEditorProps {
  slug: string
}

interface BlockTimeModalProps {
  open: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (value: TimeBlockFormValue) => Promise<boolean>
}

// Значение по умолчанию для datetime-local — «сегодня, следующий час»
function defaultLocalDateTime(hoursFromNow = 1): string {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Локальное значение datetime-local → ISO (UTC)
function toIso(localValue: string): string {
  return new Date(localValue).toISOString()
}

export function BlockTimeModal({ open, isSaving, onOpenChange, onSubmit }: BlockTimeModalProps) {
  const [startAt, setStartAt] = useState(defaultLocalDateTime(1))
  const [endAt, setEndAt] = useState(defaultLocalDateTime(2))
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStartAt(defaultLocalDateTime(1))
      setEndAt(defaultLocalDateTime(2))
      setReason('')
      setError(null)
    }
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const parsed = timeBlockFormSchema.safeParse({ startAt, endAt, reason })

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Проверьте поля')
      return
    }

    setError(null)
    await onSubmit(parsed.data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Заблокировать время</DialogTitle>
          <DialogDescription>
            Слоты внутри этого интервала не будут выдаваться гостям.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-start">Начало</Label>
            <Input
              id="block-start"
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-end">Конец</Label>
            <Input
              id="block-end"
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="block-reason">Причина (необязательно)</Label>
            <Input
              id="block-reason"
              value={reason}
              maxLength={500}
              placeholder="Например: отпуск"
              onChange={(event) => setReason(event.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSaving}>
              Заблокировать
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BlocksEditor({ slug }: BlocksEditorProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)

    try {
      setBlocks(await call(api.timeBlocksClient.listTimeBlocks(slug)))
      setError(null)
    } catch {
      setError('Не удалось загрузить блокировки')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async (value: TimeBlockFormValue): Promise<boolean> => {
    setIsSaving(true)

    try {
      const created = await call(
        api.timeBlocksClient.createTimeBlock(slug, {
          startAt: toIso(value.startAt),
          endAt: toIso(value.endAt),
          reason: value.reason || undefined,
        }),
      )
      setBlocks((prev) => [...prev, created].sort((a, b) => a.startAt.localeCompare(b.startAt)))
      setIsModalOpen(false)
      toast.success('Время заблокировано')
      return true
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : 'Не удалось создать блокировку')
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (block: TimeBlock) => {
    try {
      await call(api.timeBlocksClient.deleteTimeBlock(slug, block.id))
      setBlocks((prev) => prev.filter((item) => item.id !== block.id))
      toast.success('Блокировка снята')
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : 'Не удалось снять блокировку')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* На узком экране текст и кнопка в столбик, иначе текст сжимается в узкую колонку (#49) */}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-[13px] text-muted-foreground">
          Отпуск, личные дела — гости не увидят эти слоты
        </p>
        <Button type="button" variant="outline" onClick={() => setIsModalOpen(true)}>
          Заблокировать время
        </Button>
      </div>

      {isLoading && <p>Загрузка блокировок…</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!isLoading && !error && blocks.length === 0 && (
        <p className="text-sm text-muted-foreground">Нет блокировок</p>
      )}

      {!isLoading && !error && blocks.length > 0 && (
        <ul className="flex flex-col gap-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className={cn('flex items-center gap-3 rounded-xl border bg-card p-3')}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <CalendarOff className="size-4" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">
                  {formatDateTimeInZone(block.startAt, defaultTimeZone)} –{' '}
                  {formatDateTimeInZone(block.endAt, defaultTimeZone)}
                </span>
                {block.reason && (
                  <span className="truncate text-[13px] text-muted-foreground">{block.reason}</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Снять блокировку: ${formatDateTimeInZone(block.startAt, defaultTimeZone)}`}
                onClick={() => handleDelete(block)}
              >
                <Trash2 className="size-4 text-destructive" strokeWidth={1.8} aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <BlockTimeModal
        open={isModalOpen}
        isSaving={isSaving}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreate}
      />
    </div>
  )
}
