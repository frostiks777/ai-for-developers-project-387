import { Link } from 'react-router-dom'

import { AppHeader } from '@/components/app-header'
import { AppShell } from '@/components/app-shell'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <AppShell>
      <AppHeader linkTo="/dashboard" linkLabel="Организатору" variant="mobile" />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <p className="text-6xl font-semibold text-muted-foreground">404</p>
        <h2 className="font-serif text-[28px] font-semibold leading-tight">Страница не найдена</h2>
        <p className="text-sm text-muted-foreground">
          Возможно, ссылка устарела или организатор ещё не открыл запись.
        </p>
        <Button className="mt-2" asChild>
          <Link to="/">На главную</Link>
        </Button>
      </main>
    </AppShell>
  )
}
