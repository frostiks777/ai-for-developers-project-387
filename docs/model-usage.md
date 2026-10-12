# Использование моделей: бесплатные модели для субагентов

## Правило (обязательное)

**Все субагенты в этом проекте используют ТОЛЬКО бесплатные модели провайдера `opencode` (Hexlet Students / OpenCode). Запрещено запускать субагентов на платных моделях.**

Это правило распространяется на:
- Встроенных субагентов `explore` и `general`
- Любых пользовательских субагентов (если появятся; сейчас их нет — ни `.opencode/agents/`, ни кастомных агентов в конфиге)
- Явный вызов `subagent(...)` из основного агента

## Бесплатные модели (актуальный срез)

Дефолтный провайдер проекта — **`opencode`** (Hexlet Students / OpenCode). Ниже — все его активные бесплатные модели.

**Срез: 2026-10-12.** Источники: `opencode models opencode` (CLI 1.19.0) — список реально доступных моделей; `https://models.dev/api.json` — цены, контекст, reasoning-варианты.

| ID модели                                  | Название                     | Контекст | Variants (reasoning)             |
|--------------------------------------------|------------------------------|----------|----------------------------------|
| `opencode/muse-spark-1.3-contributor-free` | Muse Spark 1.3 Free          | 1M       | minimal, low, medium, high, xhigh |
| `opencode/space-bunny-free`                | Space Bunny Free             | 1M       | low, medium, high, xhigh, max   |
| `opencode/nemotron-3-ultra-free`           | Nemotron 3 Ultra Free        | 1M       | —                                |
| `opencode/nemotron-3.5-lightning-free`     | Nemotron 3.5 Lightning Free  | 262k     | —                                |
| `opencode/ling-3.0-flash-fin-free`         | Ling 3.0 Flash Fin Free      | 262k     | toggle (вкл/выкл reasoning)      |
| `opencode/mimo-v2.6-flash-free`            | MiMo-V2.6-Flash Free         | 200k     | —                                |
| `opencode/big-pickle`                      | Big Pickle                   | 200k     | —                                |

**Всего в opencode:** 31 модель, **7 бесплатных**.

Цена: вход и выход — **0 USD** за все семь бесплатных моделей (cost = 0/0/0 по `models.dev`).

> Проверять наличие модели перед использованием: `opencode models opencode | Select-String free`. Модель может быть в `models.dev`, но не отдаваться провайдером (см. `step-5-preview-free` ниже).

### Как указывать variant

Если модель поддерживает варианты (столбец «Variants»), конкретный уровень задаётся суффиксом `#<variant>` после ID. Например:

```
opencode/muse-spark-1.3-contributor-free#medium
```

По умолчанию подставляется вариант из opencode-схемы (для большинства моделей — без суффикса).

### Notes (динамика каталога)

- `opencode/mimo-v2.5-free` — удалён из каталога, заменён на `opencode/mimo-v2.6-flash-free` (sync #1).
- `opencode/muse-spark-1.3-contributor-free` и `opencode/space-bunny-free` — единственные модели провайдера с настраиваемыми reasoning-уровнями через effort; у остальных либо фиксированный reasoning, либо toggle (`ling-3.0-flash-fin-free`).
- **Не бесплатные** модели провайдера `opencode` (справочно, запрещены для субагентов): `deepseek-v4-flash`, `deepseek-v4-flash-vision-exp`, `deepseek-v4-pro`, `deepseek-v4.1-flash`, `glm-5.1`, `glm-5.2`, `glm-5.3`, `glm-5.3-flash`, `grok-4.5`, `grok-4.6`, `grok-4.7`, `grok-build-0.1`, `kimi-k2.5`, `kimi-k2.6`, `kimi-k2.7-code`, `kimi-k3`, `minimax-m2.5`, `minimax-m2.7`, `minimax-m3`, `muse-spark-1.2`, `muse-spark-1.3`, `qwen3.5-plus`, `qwen3.6-plus`, `qwen3.8-flash`.

### `step-5-preview` — анонсирована, но недоступна

| Модель | Цена (1M токенов) | Статус |
|--------|-------------------|--------|
| `opencode/step-5-preview-free` | 0 / 0 | ❌ **недоступна** |
| `openrouter/stepfun/step-5-preview` | input 1 USD / output 2.7 USD | ❌ платная |

`opencode/step-5-preview-free` присутствует в `models.dev` (контекст 1M, effort `low|medium|high`, вход text/image/video), но:

- её **нет** в выдаче `opencode models opencode`;
- прямой прогон `opencode run -m opencode/step-5-preview-free "say OK"` падает с `UnknownError: Unexpected server error` (проверено 3 раза, в т.ч. с суффиксом `#medium`).

**Вывод:** не использовать, пока модель не появится в `opencode models opencode` и не пройдёт пробный прогон. Вариант через OpenRouter платный — для субагентов запрещён.

## Дополнительный бесплатный провайдер: OpenRouter (справочно)

В каталоге помимо `opencode` доступен провайдер **`openrouter`** с моделями-роутерами и бесплатным free-tier. По умолчанию проект **не использует** их (дефолт привязан к `opencode` в `opencode.jsonc`) — ниже справочно.

**Всего в openrouter:** 379 моделей, **14 с суффиксом `:free`**.

> ⚠️ Суффикс `:free` в каталоге openrouter **не гарантирует нулевую стоимость**: у части моделей в `models.dev` указана ненулевая цена (например `thinkingmachines/inkling` — 1/4.05 USD, `nvidia/nemotron-3-ultra-550b-a55b:free` — 0.6/2.4 USD). Если модель пойдёт в прод-конфиг — проверять цену по факту, а не по суффиксу.

### Текущие бесплатные (`:free`)

| ID                                                  | Цена (1M, по models.dev) |
|-----------------------------------------------------|--------------------------|
| `openrouter/apodex/apodex-1.1-mini:free`            | н/д                      |
| `openrouter/cohere/north-mini-code:free`           | н/д                      |
| `openrouter/dots-studio/dots-3-note-preview:free`  | н/д                      |
| `openrouter/liquid/lfm-2.5-2.6b:free`              | н/д                      |
| `openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | н/д          |
| `openrouter/nvidia/nemotron-3.5-content-safety:free` | 0.2 / 0.2               |
| `openrouter/nvidia/nemotron-3.5-lightning:free`    | 0.07 / 0.2               |
| `openrouter/nvidia/nemotron-3-super-120b-a12b:free` | 0.08 / 0.45              |
| `openrouter/poolside/laguna-s-2.1:free`             | 0.09 / 0.18              |
| `openrouter/poolside/laguna-xs-2.1:free`            | 0.06 / 0.12              |
| `openrouter/google/gemma-4-26b-a4b-it:free`         | 0.09 / 0.3               |
| `openrouter/google/gemma-4-31b-it:free`             | 0.09 / 0.34              |
| `openrouter/nvidia/nemotron-3-ultra-550b-a55b:free` | 0.6 / 2.4                |
| `openrouter/thinkingmachines/inkling:free`          | 1 / 4.05                 |
| `openrouter/thinkingmachines/inkling-small:free`    | 0.45 / 1.2               |

### Ушли из бесплатных / удалены (история)

- `openrouter/z-ai/glm-5.2:free` — провайдер GLM ушёл с free-tier.
- `openrouter/qwen/qwen3.8-27b:free` — больше не в каталоге.
- `openrouter/inclusionai/ling-3.0-flash-vl:free`, `openrouter/nex-agi/nex-n2.5-mini:free` — больше не в каталоге.
- Роутеры `openrouter/openrouter/free|auto|fusion|pareto-code|bodybuilder` и `openrouter/google/lyria-3-clip-preview` — **больше не входят в бесплатный список** opencode-каталога (sync #2). Использовать, если пойдёт в конфиг, только после проверки цены.

> Если решим переключить дефолт субагентов на OpenRouter или добавить конкретные модели как запасные, **оформить это как ADR** и обновить `opencode.jsonc` + эту таблицу. До тех пор — справочник, а не источник правды для конфига.

### Сводная статистика каталога (2026-10-12)

```
Всего моделей в каталоге opencode: 412 (31 opencode + 379 openrouter + 2 deepseek)
Бесплатных у провайдера opencode: 7 (cost 0/0)
Суффикс :free у openrouter: 14
```

> Срез через `opencode models <provider>` (CLI 1.19.0) + `models.dev/api.json`. Каталог живой — перед важным запуском перепроверять.


## Как это настроено

### opencode.jsonc (дефолтные модели субагентов)

Встроенные субагенты `explore` и `general` привязаны к бесплатной модели:

```jsonc
{
  "agent": {
    "explore": {
      "model": "opencode/muse-spark-1.3-contributor-free"
    },
    "general": {
      "model": "opencode/muse-spark-1.3-contributor-free"
    }
  }
}
```

> Ключ в конфиге — `"agent"` (не `"agents"`), это подтверждено схемой opencode.

Это задаёт **дефолтную** модель для каждого субагента. Если субагент наследует модель от родителя, он тоже получит бесплатную модель.

### AGENTS.md (инструкция для агента)

AGENTS.md содержит явное правило: при запуске субагента всегда указывать бесплатную модель и **никогда** не переопределять её на платную.

## Почему это важно

- Субагенты запускаются часто (исследование кода, проверка, тестирование) и потребляют много токенов
- Платные модели стоят денег за каждый токен входа и выхода
- Бесплатные модели Hexlet Students работают на том же уровне для типичных задач кодирования
- Экономия бюджета без потери качества для educational-проекта

## Проверка перед запуском субагента

Перед вызовом `subagent()` убедитесь:

1. **Не указывайте параметр `model`** — тогда субагент использует дефолт из `opencode.jsonc` (бесплатная модель)
2. **Если указываете `model` явно** — используйте только ID из таблицы бесплатных моделей выше
3. **Никогда не используйте** модели `anthropic/*`, `openai/*` или другие платные провайдеры

### Правильно ✓

```
subagent(agent="explore", prompt="Найди компонент UserCard")
subagent(agent="general", prompt="Проведи рефакторинг hooks")
subagent(agent="explore", prompt="Прочитай docs/architecture.md", model="opencode/ling-3.0-flash-fin-free")
```

### Неправильно ✗

```
subagent(agent="general", prompt="...", model="anthropic/claude-sonnet-4-5")  // платная модель
subagent(agent="explore", prompt="...", model="gpt-4o")                       // платная модель
subagent(agent="general", prompt="...", model="opencode/step-5-preview-free") // анонсирована, провайдер не отдаёт
```

## Опциональное ужесточение (глобально)

Если вы хотите заблокировать платные модели **глобально на уровне провайдера** (влияет и на main-агента), добавьте в `~/.config/opencode/opencode.json(c)`:

```jsonc
{
  "experimental": {
    "policies": [
      { "action": "provider.use", "resource": "*", "effect": "deny" },
      { "action": "provider.use", "resource": "opencode", "effect": "allow" }
    ]
  }
}
```

⚠️ Это **полностью запретит** все платные модели (Anthropic, OpenAI, и т.д.) для всей сессии, включая основного агента. Используйте только если вам не нужны платные модели ни для каких задач.

## Связанные документы

- `AGENTS.md` — основные правила проекта
- `docs/agent-principles.md` — архитектура агентной системы и делегирование субагентам
