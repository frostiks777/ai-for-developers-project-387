# TypeSpec toolchain — research note (September 2026)

> **Статус:** выполнено 2026-09-24, конвейер работает ([ADR-0011](../adr/0011-event-types-status-and-availability-ranges.md), `npm run api:generate`). Документ сохранён как обоснование выбора версий.
> Упоминания «Fastify + SQLite» в заголовках — на момент исследования; сейчас БД — PostgreSQL/Neon
> ([ADR-0013](../adr/0013-postgres-migration.md)). Выводы по toolchain'у (alpha-статус серверного эмиттера, ручные маршруты и валидация) остаются актуальными.

Ticket: #13 («TypeSpec toolchain 2026»).
Goal: versions, packages, minimal `main.tsp`, `tspconfig.yaml`, one-command generation,
limitations for a small Fastify app, discriminated unions for errors.

All versions below were verified against the npm registry on **2026-09-24**
(`npm view <pkg> version time.modified`) and the official docs at
https://typespec.io (banner: «Version 1.16.0 is now available!»).

## 1. Versions (stable/latest, September 2026)

| Package | Version | Status | Role |
|---|---|---|---|
| `@typespec/compiler` | **1.16.0** (2026-09-21) | stable, `latest` | CLI (`tsp`), language, standard library |
| `@typespec/http` | **1.16.0** | stable | HTTP decorators: `@service`, `@server`, `@route`, `@get/@post/@put/@delete`, `@path`, `@query`, `@body`, `@statusCode`, `@error` |
| `@typespec/openapi3` | **1.16.0** | stable | OpenAPI 3 emitter |
| `@typespec/rest` | **0.86.0** | stable, still a **separate** package | Resource/routing helpers on top of `@typespec/http` (`@resource`, standard resource ops). Only needed if you use the resource pattern |
| `@typespec/http-client-js` | **0.16.2** (2026-09-12), `next: 0.16.3-dev.3` | **preview** | Official TypeScript/JavaScript HTTP client emitter (successor concept to the old generators) |
| `@typespec/http-server-js` | **0.58.0-alpha.29** (2026-09-09) | **alpha / experimental** | JS/TS server stub + router generator (Node `http` + optional Express middleware). **No Fastify adapter** |
| `@azure-tools/typespec-client-generator-cli` (`tsp-client`) | 0.33.1 (2026-05-01) | stable but **Azure-SDK-only pipeline** | `tsp-client init/update` works against `azure-rest-api-specs` + `tsp-location.yaml` + `eng/emitter-package.json`. **Not suitable for this project** |
| `@azure-tools/typespec-ts` | 0.57.0 (2026-09-15) | maintained, Azure-focused | Older TS generator (RLC / modular). Relevant only if you target the Azure SDK style; prefer `@typespec/http-client-js` for a plain app |

Versioning rule observed in the repo: `compiler`, `http`, `openapi`, `openapi3`,
`json-schema` move in lockstep (`1.16.0`); satellite libraries (`rest`,
`versioning`, `streams`, `events`, `sse`) have their own `0.86.0` line.
Peer deps confirm the pairing: `openapi3@1.16.0` requires
`@typespec/compiler ^1.16.0` + `@typespec/http ^1.16.0`;
`http-client-js@0.16.2` requires `compiler/http ^1.16.0` + `rest ^0.86.0`.

Runtime requirement: **`Node.js >= 22.0.0`, npm >= 7.0.0**
(`engines` of `@typespec/compiler@1.16.0`; also stated in the official setup guide).

### Install (copy-paste)

```bash
npm install -g @typespec/compiler
tsp --version
```

Per-project (recommended — pin the toolchain in the repo):

```bash
npm i -D @typespec/compiler@1.16.0 @typespec/http@1.16.0 @typespec/openapi3@1.16.0 @typespec/http-client-js@0.16.2
```

`@typespec/rest@0.86.0` — add only if you use `@resource`-style routes.
`@typespec/http-server-js@0.58.0-alpha.29` — optional, alpha (see §5).

## 2. Minimal `main.tsp` (current syntax)

Covers everything asked: `@service`, `@server`, namespaces, models,
`@route`, `@get`/`@post`, `@path`, `@body`, status codes, `@error` models.
Adapted from the official «Getting Started with TypeSpec for REST APIs» guide:

```tsp
import "@typespec/http";
import "@typespec/openapi3";
using Http;

@service(#{ title: "Call Calendar" })
@server("http://localhost:3000", "Local dev server")
namespace CallCalendar;

model Call {
  id: int32;
  @minLength(1) title: string;
  @minValue(1) @maxValue(1440) durationMinutes: int32;
  startsAt: utcDateTime;
  attendeeEmail?: string;
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}

@error
model ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details: string[];
}

@route("/calls")
namespace Calls {
  @get
  op listCalls(): {
    @statusCode statusCode: 200;
    @body calls: Call[];
  };

  @get
  op getCall(@path callId: int32):
    | { @statusCode statusCode: 200; @body call: Call; }
    | { @statusCode statusCode: 404; @body error: NotFoundError; };

  @post
  op createCall(@body call: Call):
    | { @statusCode statusCode: 201; @body created: Call; }
    | { @statusCode statusCode: 400; @body error: ValidationError; };

  @delete
  op deleteCall(@path callId: int32):
    | { @statusCode statusCode: 204; }
    | { @statusCode statusCode: 404; @body error: NotFoundError; };
}
```

Notes:

- The `|` operator declares multiple possible responses per operation
  (success + error variants); it maps to per-status entries in `openapi.yaml`.
- `@server` accepts a URL + description; multiple `@server` decorators are allowed.
- Validation decorators (`@minLength`, `@minValue`, `@maxValue`, `@pattern`, …)
  flow into OpenAPI schemas (`minLength`, `minimum`, …) but do **not** generate
  runtime (zod) validation — see §5.

## 3. `tspconfig.yaml` + one-command generation

```yaml
# tspconfig.yaml (project root, next to package.json)
kind: project
entrypoint: main.tsp

emit:
  - "@typespec/openapi3"
  - "@typespec/http-client-js"

options:
  "@typespec/openapi3":
    emitter-output-dir: "{project-root}/tsp-output/openapi"
    file-type: yaml # or: json
  "@typespec/http-client-js":
    emitter-output-dir: "{project-root}/tsp-output/client"
    packageDetails:
      name: "call-calendar-client"
      version: "0.1.0"
```

Exact commands (run from the folder containing `tspconfig.yaml`):

```bash
tsp install    # install deps declared for the spec project (one time)
tsp compile .  # emit EVERYTHING listed under `emit:` — one command
```

Variants:

```bash
tsp compile . --emit=@typespec/openapi3        # only OpenAPI 3
tsp compile . --emit=@typespec/http-client-js  # only the TS client
tsp compile . --watch                          # re-emit on save (dev loop)
```

Scaffold helper: `tsp init` (choose the «Generic REST API» template) creates
`main.tsp` + `tspconfig.yaml` + `package.json` for you.

`tsp-client` init/update flow: **not applicable here**. `tsp-client init -c
<url-or-path-to-tspconfig>`, `tsp-client update/sync/generate` and
`tsp-location.yaml` + `eng/emitter-package.json` belong to the Azure SDK
machine pipeline (syncs specs out of `Azure/azure-rest-api-specs` and generates
per-language SDK repos). For this project the equivalent of «init/update» is
`git pull` + `tsp compile .`.

## 4. TypeScript client SDK — official way in 2026

- **Use `@typespec/http-client-js`** (preview, `@preview` on the docs site).
  Declared in `tspconfig.yaml` as above; no extra CLI beyond `tsp compile .`.
- `tsp-client` / `@azure-tools/typespec-client-generator-cli` is **not** a
  general-purpose generator — Azure SDK repos only (see §3).
- `@azure-tools/typespec-ts` (0.57.0) is the previous-generation Azure TS
  emitter; ignore unless you deliberately want the Azure RLC/modular style.
- Plain **OpenAPI Generator** remains a valid fallback: emit `openapi.yaml`
  via `@typespec/openapi3`, then run any OpenAPI-based generator on it.
  Useful if the preview JS emitter lacks a feature you need.

## 5. Server-side artifacts + limitations for Fastify + SQLite

What exists:

- `@typespec/http-server-js` (alpha) generates: TS interfaces for all models,
  service interfaces (one per interface/namespace group), a static router with
  `dispatch` (Node `http` handler signature), per-operation request
  parsing/validation, and — with `express: true` — an Express middleware.
- OpenAPI 3 output (`openapi.yaml`) is stable and can feed Swagger UI,
  contract tests, or codegen.

Caveats / risks for our stack:

1. **No Fastify support.** The JS server emitter binds to raw Node `http` or
   Express. There is no Fastify adapter/option in 2026. Adopting the generated
   router would mean running Express (or raw http) next to/inside Fastify —
   friction, not a fit.
2. **No zod integration.** No official emitter produces zod schemas or
   `server/validation.ts`-style mirrors. Validation decorators (`@minLength`,
   …) only constrain the OpenAPI schema; runtime validation stays hand-written
   (keep our existing `server/validation.ts` ↔ `src/lib/validation.ts` mirror).
3. **Alpha quality.** The package README itself warns of breaking changes and
   bugs (`0.58.0-alpha.x`, «highly experimental»). Pinning it would import
   churn (Express, `swagger-ui-express`, vitest, TS ~6 tooling) into our small
   service.
4. **Node floor is 22.** Fine for new work, but CI images and contributor
   setups must use Node ≥ 22 (check `.github/workflows/hexlet-check.yml`
   environment — do not edit that file, just be aware).
5. **Recommendation: spec = contract + client, not server.** Keep TypeSpec as
   the source of truth for `openapi.yaml` (+ generated TS client for the
   frontend), keep hand-written Fastify routes + zod + Drizzle. Revisit the
   server emitter only if it reaches stable **with** a Fastify target.

## 6. Discriminated unions for error responses — yes

Both forms are expressible and emit OpenAPI `discriminator`/`oneOf`:

```tsp
// Form A: union + @discriminated (variant name = discriminator value)
@discriminated
union CallEvent {
  created: CallCreated,
  cancelled: CallCancelled,
}

model CallCreated { kind: "created"; call: Call; }
model CallCancelled { kind: "cancelled"; reason: string; }

// Form B: inheritance + @discriminator (classic polymorphism, allOf)
@discriminator("code")
model ApiError { message: string; }

model NotFound extends ApiError { code: "NOT_FOUND"; }
model ValidationFailed extends ApiError { code: "VALIDATION_ERROR"; details: string[]; }

@error
@discriminator("code")
model CodedError { code: string; message: string; }
```

Customisation: `@discriminated(#{ discriminatorPropertyName: "kind",
envelopePropertyName: "value", envelope: "object" })`, or `envelope: "none"`
to inline the discriminator into each variant (closest to zod's
`z.discriminatedUnion`). `@error` composes with both forms (any model extending
an `@error` model is itself an error model).

## Sources

- Versions/peer deps/engines: npm registry —
  https://www.npmjs.com/package/@typespec/compiler (1.16.0),
  https://www.npmjs.com/package/@typespec/openapi3 (1.16.0),
  https://www.npmjs.com/package/@typespec/http (1.16.0),
  https://www.npmjs.com/package/@typespec/rest (0.86.0),
  https://www.npmjs.com/package/@typespec/http-client-js (0.16.2),
  https://www.npmjs.com/package/@typespec/http-server-js (0.58.0-alpha.29),
  https://www.npmjs.com/package/@azure-tools/typespec-client-generator-cli (0.33.1),
  https://www.npmjs.com/package/@azure-tools/typespec-ts (0.57.0)
- Setup (Node ≥ 22, `tsp init`, `tsp install`, `tsp compile .`):
  https://typespec.io/docs/getting-started/getting-started-rest/01-setup-basic-syntax/
- Operations/responses (`@route`, `@get/@post`, `@path`, `@body`, `@statusCode`, `|`):
  https://typespec.io/docs/getting-started/getting-started-rest/02-operations-responses/
- Error models (`@error`):
  https://typespec.io/docs/getting-started/getting-started-rest/03-handling-errors/
- `tspconfig.yaml` reference (`emit`, `options`, `emitter-output-dir`):
  https://typespec.io/docs/handbook/configuration/configuration/
- Client emitters overview (`@typespec/http-client-js`, `packageDetails`):
  https://typespec.io/docs/emitters/clients/introduction/
- JS client emitter usage: https://typespec.io/docs/emitters/clients/http-client-js/reference/
- JS server emitter (alpha, Node/Express only):
  https://typespec.io/docs/emitters/servers/http-server-js/reference/
  and https://typespec.io/docs/emitters/servers/http-server-js/project/
- Discriminated types (`@discriminated`, `@discriminator`):
  https://typespec.io/docs/standard-library/discriminated-types/
  and https://typespec.io/docs/getting-started/typespec-for-openapi-dev/
- `tsp-client` (Azure-only) usage:
  https://azure.github.io/typespec-azure/docs/howtos/generate-with-tsp-client/intro_tsp_client/
  and https://github.com/Azure/azure-sdk-tools/blob/main/tools/tsp-client/README.md
- Release history: https://github.com/microsoft/typespec/releases
  and https://github.com/microsoft/typespec/blob/main/packages/compiler/CHANGELOG.md
