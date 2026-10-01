---
name: commit-push
description: Use when the user asks to commit and push changes — «сделай коммит и пуш», «коммит + пуш», «закоммить», «запушь», «залей изменения», «commit», «push». Runs project checks, stages only intended files, writes a Conventional Commits message, commits and pushes.
---

# Commit & Push

Workflow для коммита и пуша в этом репозитории (Node.js/TypeScript, Conventional Commits).

## 1. Проверки перед коммитом

```bash
git status --short
git diff
git log --oneline -10
```

Затем прогнать проверки и починить проблемы до коммита:

```bash
npm run lint
npm run typecheck
npm test
```

Пропускать проверки можно только по явной просьбе пользователя.

## 2. Стейджинг

- Стейджить только конкретные файлы: `git add <paths>`; `git add -A` — только если все изменения относятся к одной задаче.
- Не коммитить секреты, `.env`, `node_modules`, `dist`, `server/data/*.db`, логи.
- Если изменений несколько логических — делать отдельные коммиты, по одному на изменение.

## 3. Сообщение коммита

Conventional Commits, тип на английском, описание краткое и в повелительном наклонении.
**Каждое сообщение содержит номер Issue `(#NN)`** — от этого зависит `release-please` и восстановление хода агентной разработки:

- `feat: add slot booking dialog with toasts (#42)`
- `fix: bind vite dev server to ipv4 (#57)`
- `chore: add commit-push skill (#93)`
- `docs:`, `refactor:`, `test:` — по смыслу

Порядок работы:

1. Задача/баг до начала работы оформлены Issue (`gh issue create`, методология — `docs/agents/issue-tracker.md`); баги — с меткой `bug`, chore-подобные задачи — без метки типа (метки `chore` в репозитории нет).
2. В сообщении коммита указан `(#NN)`.
3. После пуша Issue закрывается: `gh issue close <NN> --comment "..."`.

Единственное исключение — однострочные механические правки без изменения поведения.

## 4. Коммит и пуш

```bash
git commit -m "<type>: <описание>"
git push
```

- Не амендить, не пропускать хуки, не делать force-push без явной просьбы.
- Если у ветки нет upstream: `git push -u origin <branch>`.

## 5. Отчёт

Сообщить: хеш и текст каждого коммита, ветку, результат пуша. Если пуш не удался — показать ошибку и не повторять force-варианты.

## Важное для этого репозитория

- Не трогать `.github/workflows/hexlet-check.yml` и имя репозитория.
- Историю коммитов ведём по Conventional Commits — от этого зависит release-please.
