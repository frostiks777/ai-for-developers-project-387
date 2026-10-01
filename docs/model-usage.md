# Использование моделей: бесплатные модели для субагентов

## Правило (обязательное)

**Все субагенты в этом проекте используют ТОЛЬКО бесплатные модели провайдера `opencode` (Hexlet Students / OpenCode). Запрещено запускать субагентов на платных моделях.**

Это правило распространяется на:
- Встроенных субагентов `explore` и `general`
- Любых пользовательских субагентов (если появятся; сейчас их нет — ни `.opencode/agents/`, ни кастомных агентов в конфиге)
- Явный вызов `subagent(...)` из основного агента

## Бесплатные модели (актуальный срез)

Дефолтный провайдер проекта — **`opencode`** (Hexlet Students / OpenCode). Ниже — все его активные бесплатные модели на момент последней сверки (`tools.opencode.models({ query: "free" })`).

| ID модели                                  | Название                     | Статус | Variants (reasoning)             |
|--------------------------------------------|------------------------------|--------|----------------------------------|
| `opencode/mimo-v2.6-flash-free`            | MiMo V2.6 Flash Free         | active | —                                |
| `opencode/muse-spark-1.3-contributor-free` | Muse Spark 1.3 Free          | active | minimal, low, medium, high, xhigh |
| `opencode/ling-3.0-flash-fin-free`         | Ling 3.0 Flash Fin Free      | active | —                                |
| `opencode/nemotron-3.5-lightning-free`     | Nemotron 3.5 Lightning Free  | active | —                                |
| `opencode/big-pickle`                      | Big Pickle                   | active | —                                |

**Всего в opencode:** 18 моделей, **5 бесплатных**.

Цена: вход и выход — **0 USD** за все бесплатные модели. Кэш read/write — 0 USD. Это относится и к OpenRouter-моделям ниже.

### Как указывать variant

Если модель поддерживает варианты (столбец «Variants»), конкретный уровень задаётся суффиксом `#<variant>` после ID. Например:

```
opencode/muse-spark-1.3-contributor-free#medium
```

По умолчанию подставляется вариант из opencode-схемы (для большинства моделей — без суффикса).

### Notes (динамика каталога)

- `opencode/mimo-v2.5-free` был удалён из каталога и заменён на `opencode/mimo-v2.6-flash-free` — обновите все упоминания, если встретите старый ID. История замен зафиксирована в [`MEMORY.md`](../MEMORY.md), раздел «Исправленные ошибки».
- `opencode/muse-spark-1.3-contributor-free` — единственная модель провайдера `opencode` с настраиваемыми reasoning-уровнями (`minimal`…`xhigh`); удобно для тонкой настройки качества vs скорости.
- **Не бесплатные** модели провайдера `opencode` (для справки, запрещены для субагентов): `deepseek-v4.1-flash`, `muse-spark-1.3`, `glm-5.3-flash`, `qwen3.8-flash`, `glm-5.3`, `grok-4.6`, `kimi-k3`, `kimi-k2.7-code`, `minimax-m3`, `deepseek-v4-pro`, `grok-build-0.1`, `qwen3.6-plus`, `qwen3.5-plus`.

## Дополнительный бесплатный провайдер: OpenRouter (справочно)

В каталоге помимо `opencode` доступен провайдер **`openrouter`** с бесплатными моделями. По умолчанию проект **не использует** их (дефолт привязан к `opencode` в `opencode.jsonc`), но перечислим их здесь для полноты картины и как запасной вариант. Все модели ниже — **active**, cost = 0.

**Всего в openrouter:** 115 моделей, **12 бесплатных**.

### Бесплатные модели (универсальные)

| ID                                                  | Название                   | Variants              |
|-----------------------------------------------------|----------------------------|-----------------------|
| `openrouter/inclusionai/ling-3.0-flash-vl:free`     | Ling 3.0 Flash VL          | none, thinking        |
| `openrouter/nex-agi/nex-n2.5-mini:free`             | Nex-N2.5-Mini              | none, medium, high    |
| `openrouter/dots-studio/dots-3-note-preview:free`   | Dots3-Note Preview         | none, thinking        |
| `openrouter/nvidia/nemotron-3.5-lightning:free`     | Nemotron 3.5 Lightning     | none, thinking        |
| `openrouter/liquid/lfm-2.5-2.6b:free`               | LFM2.5-2.6B                | —                     |
| `openrouter/poolside/laguna-s-2.1:free`             | Laguna S 2.1               | none, thinking        |
| `openrouter/cohere/north-mini-code:free`            | North Mini Code            | none, thinking        |

### Бесплатные модели-роутеры (auto-routing к free upstream)

Эти модели OpenRouter сами подбирают upstream бесплатную модель; качество и характеристики зависят от роутинга.

| ID                                       | Название                | Variants |
|------------------------------------------|-------------------------|----------|
| `openrouter/openrouter/free`             | Free Models Router      | —        |
| `openrouter/openrouter/fusion`           | Fusion                  | —        |
| `openrouter/openrouter/pareto-code`      | Pareto Code Router      | —        |
| `openrouter/openrouter/auto`             | Auto Router             | —        |
| `openrouter/openrouter/bodybuilder`      | Body Builder (beta)     | —        |

### Специализированные бесплатные

| ID                                          | Название                | Variants |
|---------------------------------------------|-------------------------|----------|
| `openrouter/google/lyria-3-clip-preview`    | Lyria 3 Clip Preview    | —        |

> Lyria — модель Google для генерации клипов; может быть полезна для медиа-задач, не для кода.

### Удалённые из каталога (история)

- `openrouter/qwen/qwen3.8-27b:free` — заменена платной `Qwen3.8 Max 0902`.
- `openrouter/poolside/laguna-xs-2.1:free` — больше не бесплатна (теперь `openrouter/poolside/laguna-xs-2.1` платная, 0.06/0.12).
- `openrouter/z-ai/glm-5.2:free` — провайдер GLM ушёл с free-tier (5.3 уже платная).
- `openrouter/google/gemma-4-31b-it:free` — заменена платной `Gemma 4 26B A4B IT`.

> Если решим переключить дефолт субагентов на OpenRouter или добавить конкретные модели как запасные, **оформить это как ADR** и обновить `opencode.jsonc` + эту таблицу. До тех пор — справочник, а не источник правды для конфига.

### Сводная статистика каталога

```
Всего моделей в каталоге: 133 (18 opencode + 115 openrouter)
Бесплатных: 17 (5 opencode + 12 openrouter)
Платных: 116 (13 opencode + 103 openrouter)
```

> Срез через `tools.opencode.models({ limit: 50, offset: 0|50|100 })`; total = 133, next = null (полный обход). При повторной сверке цифры могут сдвигаться — каталог живой.

## Как это настроено

### opencode.jsonc (дефолтные модели субагентов)

Встроенные субагенты `explore` и `general` привязаны к бесплатной модели:

```jsonc
{
  "agents": {
    "explore": {
      "model": "opencode/muse-spark-1.3-contributor-free"
    },
    "general": {
      "model": "opencode/muse-spark-1.3-contributor-free"
    }
  }
}
```

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
