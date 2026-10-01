import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { LocationType, type EventType } from '@/api/generated'
import { ApiError, api, call } from '@/api/sdk'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const LOCATION_LABELS: Record<LocationType, string> = {
  [LocationType.Online]: 'Онлайн',
  [LocationType.Offline]: 'Офлайн',
  [LocationType.Phone]: 'Телефон',
}

interface EventTypesEditorProps {
  slug: string
}

const emptyForm = {
  slug: '',
  title: '',
  description: '',
  durationMin: 30,
  locationType: LocationType.Online,
}

export function EventTypesEditor({ slug }: EventTypesEditorProps) {
  const [types, setTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const load = useCallback(async () => {
    setIsLoading(true)

    try {
      setTypes(await call(api.eventTypesClient.listEventTypes(slug)))
      setError(null)
    } catch {
      setError('Не удалось загрузить типы встреч')
    } finally {
      setIsLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const created = await call(
        api.eventTypesClient.createEventType(slug, {
          slug: form.slug.trim(),
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          durationMin: form.durationMin,
          locationType: form.locationType,
        }),
      )
      setTypes((prev) => [...prev, created])
      setForm(emptyForm)
      toast.success('Тип встречи добавлен')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось создать тип')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async (type: EventType) => {
    try {
      const updated = await call(
        api.eventTypesClient.updateEventType(slug, type.id, { isActive: !type.isActive }),
      )
      setTypes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось изменить тип')
    }
  }

  const handleDelete = async (type: EventType) => {
    try {
      await call(api.eventTypesClient.deleteEventType(slug, type.id))
      setTypes((prev) => prev.filter((item) => item.id !== type.id))
      toast.success('Тип встречи удалён')
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'Не удалось удалить тип')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-destructive">{error}</p>}
      {isLoading && !error && <p>Загрузка типов…</p>}

      {!isLoading && !error && (
        <ul className="flex flex-col gap-2">
          {types.map((type) => (
            <li
              key={type.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {type.title}
                  {!type.isActive && (
                    <span className="ml-2 text-xs text-muted-foreground">выключен</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {type.slug} · {type.durationMin} мин · {LOCATION_LABELS[type.locationType]}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleToggle(type)}
                >
                  {type.isActive ? 'Выключить' : 'Включить'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(type)}
                >
                  Удалить
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreate} className="flex flex-col gap-3 border-t pt-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-type-title">Название</Label>
          <Input
            id="event-type-title"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-type-slug">Slug</Label>
          <Input
            id="event-type-slug"
            value={form.slug}
            onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
            placeholder="intro-call"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-type-description">Описание</Label>
          <Input
            id="event-type-description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="event-type-duration">Длительность, мин</Label>
            <Input
              id="event-type-duration"
              type="number"
              min={15}
              max={480}
              value={form.durationMin}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, durationMin: Number(event.target.value) }))
              }
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="event-type-location">Формат</Label>
            <select
              id="event-type-location"
              value={form.locationType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, locationType: event.target.value as LocationType }))
              }
              className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {(Object.keys(LOCATION_LABELS) as LocationType[]).map((value) => (
                <option key={value} value={value}>
                  {LOCATION_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={isSaving}>
          Добавить тип
        </Button>
      </form>
    </div>
  )
}
