# План тюнинга AI-агентов для проекта «Календарь звонков»

> **АРХИВ (перенесено 2026-09-30, #100).** План **полностью внедрён** 2026-09-25: скиллы `interview`/`plan`/`ponytail`/`tdd`/`verify`, [`docs/adr/`](../adr/README.md) + ADR-0001, `docs/mcp.md`, разделы `Hygiene of context window` / `Long-term memory` / `Safety gates` в `AGENTS.md`. Незакрытые чек-листы § G и § J ниже — исторические, по ним всё сделано. Описание стека в шапке (SQLite) тоже историческое: актуальный стек — [`../../AGENTS.md`](../../AGENTS.md). Канон: [`README.md`](README.md) архива.

> Источник принципов: внешняя методичка `ai_agent_tuning_plan.md` (память/контекст, процессные скиллы, MCP, верификация, безопасность), адаптированная под этот стек: **Node.js + TypeScript + Fastify 5 + React 18 + Vite 6 + shadcn/ui + Drizzle ORM + SQLite + Vitest 4 + ESLint 9**.
>
> Дата: 2026-09-22.Автор: AI-агент (аудит + проектирование).

---

## 0. Стартовая оценка (что уже есть, чего не хватает)

Скелет проекта **уже покрывает** базовые требования методички:
- `AGENTS.md` — корневой файл памяти проекта (`docs/ai-tuning-plan.md` § A.1)
- `opencode.jsonc` — конфигурация main-агента и субагентов с **бесплатными моделями**
- `MEMORY.md` в корне — долгосрочная внешняя память (состояние проекта, решения)
- `.agents/skills/commit-push/` — первый процессный скилл (lint+typecheck+test → commit → push)
- `docs/model-usage.md` + `docs/agent-principles.md` — теория и правила выбора моделей
- CI-инструменты: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — полностью готовы

**Чего не хватает** (по разделам методички):
- Процессные скиллы: `interview`, `plan`, `ponytail`, `tdd`, `verify` — отсутствуют
- MCP-инструменты: блок `"mcp"` в `opencode.jsonc` — отсутствует
- ADR-хранилище: `docs/adr/` (шаблон + индекс) — отсутствует
- Safety gates и правило «2 итераций → reset» — не записаны в `AGENTS.md`
- Связи `AGENTS.md → MEMORY.md → ADR` явно не зафиксированы

Инфраструктурные скиллы (k8s/helm/dokploy) **намеренно пропускаются** — проект учебный, до k8s не дойдёт (см. ответы на интервью).

---

## A. Память и контекст

### A.1. Правило «2 неудачных итераций → reset»

**Цель:** защитить основное окно контекста от деградации при зацикливании.

**Где:** добавить раздел в `AGENTS.md` (новый блок после `## Agent behavior`).

**Что написать:**

```markdown
## Hygiene of context window

- **Правило 2 итераций:** если после двух последовательных неудачных правок
  одна и та же проверка (lint/typecheck/test/build) всё ещё красная —
  остановиться и:
  1. Сформулировать чем текущий подход плох (одно предложение).
  2. Сформулировать альтернативный подход (одно предложение).
  3. Спросить пользователя через `question(...)` каким путём идти.
- Контекст не жалко. Если диалог раздулся и прогресс нулевой — предложить
  `/compact` либо начать новый чат, приложив ссылку на ключевые артефакты
  (`docs/`, `MEMORY.md`, ADR).
- Файлы-договоренности (`AGENTS.md`, `MEMORY.md`, `docs/adr/*.md`) — единственный
  долгосрочный носитель контекста между сессиями.
```

**Проверка:** прочитать `AGENTS.md` после правки — раздел присутствует, не дублирует существующий текст.

### A.2. Долгосрочная память: `MEMORY.md` (уже есть) — закрепить формат

**Что есть:** `C:\Hexlet\ai-for-developers-project-386\MEMORY.md` уже описывает «Текущее состояние / Исправленные ошибки / Версии зависимостей / Результаты проверок / Что сделано / Что осталось / Ключевые решения / Окружение».

**Что добавить** в `AGENTS.md` (новый блок):

```markdown
## Long-term memory

- Состояние проекта между сессиями хранится в `MEMORY.md` (корень).
  Обновлять его при: изменении стека, критичных фиксах, решении ADR,
  завершении шага курса.
- Архитектурные решения — в `docs/adr/` (см. ниже). Один ADR = одно
  решение. Формат шаблона — `docs/adr/README.md`.
- Перед началом крупной задачи: прочитать `MEMORY.md` → понять текущее
  состояние. После завершения задачи: обновить `MEMORY.md` и при
  необходимости добавить ADR.
```

**Проверка:** `MEMORY.md` существует, `AGENTS.md` ссылается на него. Файл `docs/adr/README.md` существует (см. § C).

---

## B. Процессные скиллы (5 новых)

Все скиллы — в формате, идентичном `.agents/skills/commit-push/SKILL.md`:

- YAML frontmatter: `name`, `description` (≤ 1024 символов; имя в frontmatter совпадает с именем директории).
- Тело — markdown с пронумерованными разделами.
- Язык — русский (как и существующий `commit-push`).
- Trigger-фразы в `description` — конкретные «Use when…» формулировки, чтобы opencode автоматически подгружал скилл.

### B.1. `interview` — Интервью перед действием

**Путь:** `.agents/skills/interview/SKILL.md`

**Назначение:** вместо того чтобы додумывать требования, агент задаёт уточняющие вопросы через `question(...)` (или в чате) до тех пор, пока задача не станет однозначной.

**YAML frontmatter:**

```markdown
---
name: interview
description: Use when a task is large, ambiguous, or touches public API/UX/architecture — «сделай фичу X», «добавь авторизацию», «выбери библиотеку». Before writing any code, ask 3–7 clarifying questions (цель/не-цели, пользователи, ограничения, edge-cases, success-criteria). Asking is mandatory for non-trivial tasks; trivial mechanical fixes go through directly.
---
```

**Тело (сжатый вариант):**

1. Когда применять: задача > 1 предложения, меняется архитектура/UX/API/БД/конфиг; пользователь не дал исчерпывающих деталей.
2. Когда НЕ применять: тривиальная правка (опечатка, опечатка в логе, рефакторинг 1 файла со 100% покрытием тестами).
3. Сценарий вопросов (через `question(...)` или в чате):
   - **Цель и не-цели**: что хотим получить / чего точно НЕ делаем
   - **Пользователи / роли**: кто / что увидит результат
   - **Ограничения**: стек, перформанс, бюджет токенов, обратная совместимость
   - **Edge-cases**: пустые значения, ошибки сети, конкурентный доступ
   - **Success-критерий**: какой прогон `npm run lint/typecheck/test/build` должен стать зелёным и что должно появиться в UI/БД/логах
4. После ответов: сформулировать план (через скилл `plan`, § B.2) и только потом писать код.

**Проверка:** файл существует, frontmatter корректный, `description` ≤ 1024 символов. Существующий `commit-push` не задет.

### B.2. `plan` — Планирование и декомпозиция

**Путь:** `.agents/skills/plan/SKILL.md`

**Назначение:** перед сложной задачей (после `interview`) оформить пошаговый план в чате (или в `MEMORY.md` секция «Следующие шаги»), декомпозировать на атомарные подзадачи.

**YAML frontmatter:**

```markdown
---
name: plan
description: Use when the task has more than 3 steps, changes ≥ 2 files, or is non-trivial after an interview — «спланируй», «напиши план», «декомпозируй». Produce a numbered checklist of 3–10 atomic steps before any code/edit. Each step should be verifiable (тест, lint, typecheck, build, или визуальная проверка UI). For very small mechanical fixes this skill is optional.
---
```

**Тело:**

1. Масштаб задачи → формат:
   - 1 предложение, 1 файл → без плана (прямое выполнение, см. README).
   - 2–4 файла → короткий чек-лист в чате (5–7 шагов).
   - > 4 файлов / новая архитектура / новый раздел документации → развёрнутый план, записать в `MEMORY.md` (секция «Следующие шаги») **или** в отдельный `docs/adr/NNNN-...md`.
2. Каждый шаг плана:
   - Что делается (одна правка)
   - Проверка после шага (`typecheck` / `lint` / `test` / `npm run build` / ручной чек UI)
   - Ответственный (если есть субагент — какой именно)
3. План не «забивает» контекст: финальная версия остаётся в памяти, в чат выводится только summary + ссылка.

**Проверка:** файл существует, frontmatter валиден.

### B.3. `ponytail` — Минимализм кода

**Путь:** `.agents/skills/ponytail/SKILL.md`

**Назначение:** перед тем как добавлять новый код / зависимость / конфиг, принудительно проверить: можно ли решить задачу тем, что уже есть в стеке/проекте, конфигурацией или маленькой правкой.

**YAML frontmatter:**

```markdown
---
name: ponytail
description: Use before adding a new dependency, abstraction, wrapper, or file — «добавь либу», «вынеси в модуль», «сделай обёртку». Force-check: can the task be solved with an existing component, a config value, an existing dep from package.json, or a 1–5 line edit? Only if not — propose the new abstraction and justify it in one sentence.
---
```

**Тело:**

1. **Алгоритм проверки** (последовательность «нет»):
   - Это можно сделать через уже существующую утилиту в проекте? (`src/lib/`, `src/utils/`, `src/api/`, shadcn/ui primitives)
   - Это можно сделать через уже подключённую зависимость? (проверить `package.json`)
   - Это можно сделать конфигурацией? (изменить 1 значение в `vite.config.ts`/`tsconfig.json`/`opencode.jsonc`)
   - Это можно сделать маленькой правкой в существующем файле? (1–5 строк, не выносить отдельно)
2. **Если нет ни одного «да»** — обосновать новую абстракцию **одним предложением**. Если обосновать нельзя — вернуться к шагу 1 и подумать ещё.
3. **Запрещено**:
   - Добавлять зависимость, если она даёт < 1KB и не решает принципиально новую задачу
   - Создавать новый файл для единственной функции в 3–5 строк
   - Заводить `wrappers/adapters/facades` без доказанной необходимости

**Проверка:** файл существует, frontmatter валиден.

### B.4. `tdd` — Test-driven development (адаптация)

**Путь:** `.agents/skills/tdd/SKILL.md`

**Назначение:** для логики бэкенда и нетривиальных утилит — сначала написать тест, убедиться что он красный, потом код, убедиться что зелёный. Для UI — сначала написать компонент + RTL smoke test, потом «настоящий» тест через `user-event`.

**YAML frontmatter:**

```markdown
---
name: tdd
description: Use when adding a new function, route handler, hook, or complex UI component — «напиши логику X», «добавь эндпоинт», «сделай форму». Write the failing test (или smoke-тест) before the implementation; then implement until green; then refactor with the test still green. Skip for trivial tracked by linter cases (type-only changes, рефакторинг без изменения сигнатур).
---
```

**Тело:**

1. **Алгоритм для бэкенда** (Fastify route, утилита):
   - Шаг 1: ✅ `npm test` — зелёный (baseline).
   - Шаг 2: создать/дополнить `*.test.ts` рядом (kebab-case + `.test.ts`), описать ожидаемое поведение.
   - Шаг 3: прогнать тест → красный (Red).
   - Шаг 4: реализовать минимум кода для зелёного (Green).
   - Шаг 5: вернуться к `interview`/`plan` если логика отличается от ожидаемой.
2. **Алгоритм для UI** (компонент с логикой):
   - Шаг 1: ✅ `npm test` — зелёный (baseline).
   - Шаг 2: создать `*.test.tsx` с RTL + `user-event` или скриншотным сравнением (при наличии).
   - Шаг 3: компонент с минимальной разметкой (можно пустой `<div />`) → красный тест (рендер / взаимодействие).
   - Шаг 4: реализовать компонент → зелёный.
   - Шаг 5: скриншот/визуальная проверка через `npm run dev` + browser (опционально, для UI-чувствительных фич).
3. **Когда НЕ применять**: type-only правки, рефакторинг без изменения сигнатур, чисто документные изменения.

**Проверка:** файл существует, frontmatter валиден.

### B.5. `verify` — Проверка перед отметкой «готово»

**Путь:** `.agents/skills/verify/SKILL.md`

**Назначение:** запретить отмечать задачу как выполненную без полного зелёного прогона.

**YAML frontmatter:**

```markdown
---
name: verify
description: Use before reporting a task as done — «закончил», «готово», «можно коммитить». Run the full local check chain (`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` when relevant) and report exact results. If anything is red, fix and re-run; never declare done with a red checker.
---
```

**Тело:**

1. **Минимальный чек-лист** (выполняется **всегда**):
   - `git status --short` и `git diff --stat` — проверить, что изменения покрывают задачу
   - `npm run lint` — должен быть 0 ошибок (warning допустим, если зафиксирован в `MEMORY.md`)
   - `npm run typecheck` — должен быть 0 ошибок
   - `npm test` — все должны проходить
2. **Если задача затрагивает бэкенд или БД** — дополнительно:
   - `npm run build` — должен пройти
   - (опц.) поднять `npm run server:dev`, выполнить `curl http://localhost:3000/health`
3. **Если задача затрагивает UI** — дополнительно:
   - `npm run dev` в фоне, через `browser` инструмент (если есть) — нет красных ошибок в консоли
   - (опц.) открыть один маршрут / сделать скриншот
4. **Отчёт пользователю** после прогона:
   - команда + результат (`0 errors`, `3 tests passed (N ms)`)
   - что НЕ проверялось (если что-то было пропущено)
5. **Запрещено**: писать «готово» до прохода всех пунктов выше.

**Проверка:** файл существует, frontmatter валиден.

---

## C. Долгосрочная память: ADR

### C.1. Шаблон ADR + индекс

**Где:** `docs/adr/`

**Файлы:**

1. `docs/adr/README.md` — индекс и процесс.
2. `docs/adr/0001-record-architecture-decisions.md` — базовый ADR об использовании ADR (по аналогии с Michael Nygard's ADR-template).
3. `docs/adr/template.md` — копипаст-шаблон для новых ADR.

**Содержимое `README.md` (короткий вариант):**

```markdown
# ADR (Architecture Decision Records)

Индекс архитектурных решений проекта «Календарь звонков».

## Когда писать ADR
- Выбор между ≥ 2 серьёзными альтернативами (библиотека, ORM, паттерн, БД, провайдер).
- Решение, которое нельзя легко отменить без миграции (`schema change`, `breaking API`).
- Любое отклонение от спеки (`docs/code_artifact.md`), даже если временное.

## Когда НЕ писать ADR
- Однострочный конфиг.
- Баг-фикс без архитектурного значения.
- Косметические правки (renaming, formatting).

## Процесс
1. Скопировать `template.md` → `NNNN-<slug>.md`, где NNNN — следующий номер.
2. Заполнить секции шаблона. Особенно: **Status** (Proposed/Accepted/Deprecated/Superseded) и **Consequences** (положительные и отрицательные).
3. Обновить индекс ниже: добавить строку с номером, заголовком и статусом.
4. Закоммитить отдельным коммитом: `docs: add ADR-NNNN <slug>`.

## Индекс

| # | Заголовок | Статус | Дата |
|---|---|---|---|
| [0001](../adr/0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-09-22 |
```

**Содержимое `0001-record-architecture-decisions.md` (Nygard-template):**

```markdown
# ADR 0001: Record architecture decisions

## Status
Accepted — 2026-09-22.

## Context
Мы хотим сохранять важные архитектурные решения вне контекста диалога агента,
чтобы решения переживали `/compact`, смены сессии и смены моделей.

## Decision
Все значимые архитектурные решения фиксируются в `docs/adr/NNNN-<slug>.md`
по шаблону `docs/adr/template.md`. Каждый новый ADR добавляется в индекс
(`docs/adr/README.md`).

## Consequences
- (+) Решения не теряются при перезапуске сессии.
- (+) Новые участники/агенты читают ADR за минуты вместо реверс-инжиниринга.
- (+) Отклонения от спеки (`docs/code_artifact.md`) видно явно.
- (-) Дополнительная бюрократия: писать ADR захочется не всегда. Смягчение —
  порог «когда писать / когда НЕ» в README.

## Alternatives considered
- Хранить ADR в `MEMORY.md`. Отклонено: перемешивает состояние и решения.
- Не хранить вообще. Отклонено: приводит к «забытым» решениям.
```

**Содержимое `template.md`:** минимальный скелет с `Status`, `Context`, `Decision`, `Consequences`, `Alternatives considered` (копипаста из `0001` без конкретного наполнения).

**Проверка:** три файла в `docs/adr/`, индекс обновлён, `0001` имеет статус Accepted.

### C.2. Связь AGENTS.md ↔ ADR

В `AGENTS.md` (раздел `## Long-term memory`, § A.2) добавить ссылку на `docs/adr/README.md`. Любая значимая архитектурная правка должна сопровождаться ADR (или явным «это вне scope ADR» — например, однострочный коммит).

---

## D. MCP-инструменты в `opencode.jsonc`

### D.1. Блок `mcp` в `opencode.jsonc`

**Текущее состояние** `opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/mimo-v2.6-flash-free",
  "agents": {
    "explore": { "model": "opencode/muse-spark-1.3-contributor-free" },
    "general": { "model": "opencode/muse-spark-1.3-contributor-free" }
  }
}
```

**Что добавить:** блок `"mcp"` (синтаксис зависит от версии opencode — **зафиксировать только если в схеме `$schema` есть раздел mcp; если нет — отложить**).

**Целевой вариант (адаптировать под реальную схему):**

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/mimo-v2.6-flash-free",
  "agents": {
    "explore": { "model": "opencode/muse-spark-1.3-contributor-free" },
    "general": { "model": "opencode/muse-spark-1.3-contributor-free" }
  },
  "mcp": {
    "docs": {
      // Семантический поиск по документации стека (Vite, Fastify, Drizzle, shadcn).
      // Конкретный сервер подобрать после проверки доступных MCP в opencode.
      // Если MCP недоступны в этой версии opencode — удалить весь блок и
      // перенести в раздел «Отложено» ниже.
    }
  }
}
```

**Пошагово:**

1. Открыть `https://opencode.ai/config.json` (или локально: `$schema`) и проверить, поддерживает ли версия opencode блок `mcp`.
2. **Если да**: добавить `mcp`-блок с **только локально-/HTTP-доступными** MCP-серверами. Не подключать платные облачные сервисы.
3. **Если нет (или сервер недоступен)**: пропустить весь § D, перенести в `docs/mcp.md` как «Отложено, требует проверки версии opencode».

**`websearch`/`webfetch` уже доступны** через встроенные инструменты opencode (`browser.*`, `webfetch`, `websearch` в каталоге) — это закрывает часть потребности методички без подключения MCP.

**Проверка:** `opencode.jsonc` валиден JSON, opencode запускается без ошибок. Если MCP подключён — инструменты видны в каталоге opencode.

### D.2. Документация: `docs/mcp.md`

Создать `docs/mcp.md` короткий (50–80 строк):

- Какие MCP подключены, зачем
- Когда **не** использовать (секреты, прод-данные)
- Что делать, если MCP-сервер не отвечает (fallback на `webfetch`/`browser`)
- Как добавлять новый MCP (через PR + обновление этого файла)

**Проверка:** файл существует, ссылки на `opencode.jsonc` рабочие.

---

## E. Safety Gates

### E.1. Read-only в «проде» + Human-in-the-loop

**Цель:** явно зафиксировать в `AGENTS.md`, что агент не должен выполнять опасные операции без подтверждения.

**Добавить в `AGENTS.md`** (новый раздел **после `## Hygiene of context window`**, § A.1):

```markdown
## Safety gates

- **Read-only в «проде»:** если окружение помечено как production / staging
  (например, переменная `NODE_ENV=production` или команда явно деплоит на
  удалённый сервер) — агенту разрешены **только операции чтения**: git log,
  чтение файлов, curl к уже запущенному сервису. **Запрещены**: write в
  удалённые репозитории, миграции БД, удаление файлов вне `dist/`.
- **Human-in-the-loop:** ручное применение миграций (`npm run db:push` в
  существующей БД), force-push, изменения `.github/workflows/hexlet-check.yml`
  и имени репозитория, `git reset --hard` — **только по явной просьбе
  пользователя**. Перед выполнением — показать команду и последствия в чате.
- **Деструктивные операции** (`rm -rf`, `git push --force-with-lease`,
  перезапись `MEMORY.md`, удаление ADR) — всегда показывать diff/dry-run
  и ждать подтверждения.
- **Секреты**: никогда не писать токены/ключи/пароли в код или коммиты.
  Использовать `.env` + `.env.example` (последний — в репо, первый — в
  `.gitignore`).
```

**Проверка:** `AGENTS.md` содержит этот раздел, `MEMORY.md` не задета, `.gitignore` уже исключает `.env`/`.env.*` (уже сделано в проекте).

### E.2. Read-only режим субагентов (проверка)

`opencode.jsonc` уже навязывает бесплатные модели субагентам. Дополнительно:

- Проверить, поддерживает ли opencode `permissions`/`allow`/`deny` для `explore`/`general`. **Если да** — добавить:
  ```jsonc
  "agents": {
    "explore": {
      "model": "...",
      "permission": "read"   // только чтение: grep, glob, read
    },
    "general": {
      "model": "..."
      // general остаётся write — он реализует задачи
    }
  }
  ```
- **Если не поддерживает в текущей версии** — пропустить, добавить в `docs/mcp.md` (или новый `docs/safety.md`) раздел «Отложено».

**Проверка:** если добавлено — JSON валиден, opencode запускается.

---

## F. Обновление существующих документов

### F.1. `AGENTS.md` — финальная структура

После всех правок в `AGENTS.md` должны быть разделы в порядке:

1. `## Project` (без изменений)
2. `## Critical constraints` (без изменений — `hexlet-check.yml`!repo name)
3. `## Stack` (без изменений)
4. `## Directory structure` (без изменений — обновить, добавить `docs/adr/` и `MEMORY.md`)
5. `## Commands` (без изменений)
6. `## Conventions` (без изменений)
7. `## Модели: бесплатные модели для субагентов` (без изменений)
8. `## Documentation` (дополнить: добавить `docs/adr/`, `docs/mcp.md`, `docs/code_artifact.md`, `docs/ci_cd.md`, `docs/ci_cd_render.md`, `docs/todo.md`)
9. `## Coding patterns` (без изменений)
10. `## Skills (OpenCode)` (дополнить список новых: interview, plan, ponytail, tdd, verify)
11. `## Agent behavior` (без изменений)
12. `## Hygiene of context window` (**новый**, § A.1)
13. `## Long-term memory` (**новый**, § A.2)
14. `## Safety gates` (**новый**, § E.1)

### F.2. `docs/agent-principles.md` — дополнить ссылками

В секцию «Как это применяется в нашем проекте» добавить:

- Ссылку на `docs/adr/README.md` (про ADR)
- Ссылку на новые процессные скиллы в `.agents/skills/` (interview / plan / ponytail / tdd / verify)
- Явное упоминание правила «2 итераций → reset» (отсылка к `AGENTS.md` §12)

### F.3. `MEMORY.md` — добавить link на ADR

В раздел «Ключевые решения» добавить колонку или строку «ADR-0001: Record architecture decisions» со ссылкой на `docs/adr/0001-...md`.

---

## G. Чек-лист быстрого старта (итоговый)

| # | Действие | Файл(ы) | Готово когда |
|---|---|---|---|
| 1 | A.1 Правило 2 итераций добавлено в AGENTS.md | `AGENTS.md` | Раздел `## Hygiene of context window` присутствует |
| 2 | A.2 Ссылка на MEMORY.md и ADR в AGENTS.md | `AGENTS.md` | Раздел `## Long-term memory` присутствует, ссылки рабочие |
| 3 | B.1 Скилл `interview` создан | `.agents/skills/interview/SKILL.md` | Файл существует, frontmatter валиден |
| 4 | B.2 Скилл `plan` создан | `.agents/skills/plan/SKILL.md` | Файл существует, frontmatter валиден |
| 5 | B.3 Скилл `ponytail` создан | `.agents/skills/ponytail/SKILL.md` | Файл существует, frontmatter валиден |
| 6 | B.4 Скилл `tdd` создан | `.agents/skills/tdd/SKILL.md` | Файл существует, frontmatter валиден |
| 7 | B.5 Скилл `verify` создан | `.agents/skills/verify/SKILL.md` | Файл существует, frontmatter валиден |
| 8 | C.1 README + ADR-0001 + template в `docs/adr/` | `docs/adr/{README.md,0001-record-architecture-decisions.md,template.md}` | 3 файла, индекс обновлён |
| 9 | D.1 Блок `mcp` в opencode.jsonc (если поддерживается) | `opencode.jsonc` | JSONC валиден, opencode стартует без ошибок |
| 10 | D.2 Документ `docs/mcp.md` | `docs/mcp.md` | Файл существует |
| 11 | E.1 Safety gates в AGENTS.md | `AGENTS.md` | Раздел `## Safety gates` присутствует |
| 12 | E.2 Read-only для `explore` (если поддерживается) | `opencode.jsonc` | JSONC валиден |
| 13 | F.1 Структура AGENTS.md проверена и дополнена | `AGENTS.md` | Все 14 разделов в нужном порядке |
| 14 | F.2 `docs/agent-principles.md` дополнен ссылками | `docs/agent-principles.md` | Ссылки на ADR + новые скиллы + правило 2 итераций |
| 15 | F.3 Ссылка на ADR-0001 в MEMORY.md | `MEMORY.md` | Упоминание ADR-0001 в «Ключевые решения» |

---

## H. Что НЕ делаем (и почему)

| Пункт методички | Решение | Причина |
|---|---|---|
| k8s-deploy-scaffold, helm-chart-scaffold, dokploy-repo-prep | ❌ пропустить | Проект учебный фронтенд+бэкенд; не деплоится в k8s/Helm (см. интервью); есть `docs/ci_cd.md` и `docs/ci_cd_render.md` как заглушки для GCP/Render |
| Marketplace MCP (Ozon/WB/Avito) | ❌ пропустить | Проект — календарь звонков, e-commerce не в scope |
| Hive Web MCP | ❌ пропустить | Заменяется встроенным `browser.*`/`webfetch`/`websearch` opencode; внешний сервис не нужен |
| Глобальный `deny anthropic/openai` в opencode.jsonc | ❌ пропустить | Уже сделано в `docs/model-usage.md` как опциональное; включение может сломать доступ к платным API, если они когда-то понадобятся |
| Глубокий performance sandbox / docker-стенд | ❌ пропустить | Узкое место — только SQLite in-app; CI уже прогоняет lint+test на push |

---

## I. Порядок реализации

Рекомендуемая последовательность коммитов (каждый коммит — отдельный проход `verify`-скилла):

1. **Commit 1 — `docs: scaffold docs/adr/ structure`**
   Создаёт `docs/adr/README.md`, `docs/adr/0001-record-architecture-decisions.md`, `docs/adr/template.md`. (C.1)
2. **Commit 2 — `chore: add process skills (interview, plan, ponytail, tdd, verify)`**
   Создаёт 5 SKILL.md в `.agents/skills/`. (B.1–B.5)
3. **Commit 3 — `chore(agents): add hygiene, memory, safety sections to AGENTS.md`**
   Дописывает 3 раздела в `AGENTS.md`. (A.1, A.2, E.1)
4. **Commit 4 — `chore(agents): add mcp block to opencode.jsonc + docs/mcp.md`**
   Только если MCP поддерживается в текущей версии opencode. (D.1, D.2)
5. **Commit 5 — `chore(agents): set read-only permission for explore agent`**
   Только если opencode поддерживает `permissions`. (E.2)
6. **Commit 6 — `docs: link ADR and new skills in agent-principles.md`**
   Дополняет `docs/agent-principles.md` ссылками. (F.2)
7. **Commit 7 — `docs: add ADR-0001 reference to MEMORY.md`**
   Дополняет `MEMORY.md`. (F.3)

После каждого коммита — прогон `npm run lint && npm run typecheck && npm test` (хотя эти коммиты не трогают рантайм, проверка добавляет уверенности и закаляет привычку из скилла `verify`).

---

## J. Критерии готовности плана (Definition of Done)

План считается внедрённым, когда:

- [ ] Все 15 пунктов чек-листа § G отмечены.
- [ ] Перечисленные в § H исключения сознательно зафиксированы в `MEMORY.md` или в `docs/`.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` — все зелёные.
- [ ] `MEMORY.md` обновлён: раздел «Что сделано» содержит ссылки на новые скиллы и ADR.
- [ ] `.github/workflows/hexlet-check.yml` и имя репозитория не тронуты (проверить `git log -p -- .github/workflows/hexlet-check.yml` и `git remote -v`).
- [ ] Conventional Commits сохраняются (release-please корректно прочитает историю).
