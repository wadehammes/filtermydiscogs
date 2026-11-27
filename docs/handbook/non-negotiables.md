# Non-negotiables

One-page digest of rules every substantive change and agent session follows. The numbered list in [conventions.md → Non-negotiables](conventions.md#non-negotiables-substantive-work-and-agents) is authoritative; this page is the **fast path** so you do not load all of `conventions.md` up front. Read this **before** the first edit, then open only the linked sections (via [llms.md](llms.md)) that match your task.

Applies to code you add or rewrite. Legacy code in a file can stay until you touch that area for real behavior.

## Branches and PRs

**Session gate (agents):** **`st view --json`** before the first file read/edit or branch switch. New layer → **`st add`**. New stack → **`st init`** / **`st create`**. Never **`git checkout -b`** for feature work.

| Always | Never | Details |
| ------ | ----- | ------- |
| **`st`** / gh-stack into **`staging`**; plan layers before coding | Parallel **`git checkout -b …`** off **`staging`** for multi-theme or stacked work | [conventions §8](conventions.md#non-negotiables-substantive-work-and-agents), [platform.md → Stacked pull requests](platform.md#stacked-pull-requests-st) |
| **`st init`** / **`st create`** (even single-layer), **`st add`**, **`./scripts/git-commit.sh`**, **`st sync`**, **`st view --json`**, **`st ss --auto`** | Raw **`git commit`** in agent sessions (blocked by hooks) | [`.cursor/skills/stacked-prs/SKILL.md`](../../.cursor/skills/stacked-prs/SKILL.md) |
| One reviewable concern per stack layer | Unrelated themes in one branch | [platform.md → Stacked pull requests](platform.md#stacked-pull-requests-st) |

## Tests

| Always | Never | Details |
| ------ | ----- | ------- |
| Failing spec first, then minimal production code | Production first, specs backfilled | [conventions → TDD](conventions.md#test-driven-development-tdd) |
| **`src/tests/factories/`** + MSW builders (`releaseFactory`, `buildE2e…`, …) | Inline `{ id: 1, title: "…" }` domain objects | [factories.md](factories.md), [conventions §2](conventions.md#non-negotiables-substantive-work-and-agents) |
| One top-level **`describe`** per hook spec; outcome-focused **`it`** strings | Nested **`describe`** | [Hook checklist](conventions.md#hook-and-feature-spec-checklist) |
| **`api.*`** mocks in **`.po.tsx`** (`setupMocks()`, **`mockApiResponse`**) | **`mockApiResponse`** / **`jest.mocked(api.*)`** in **`.spec.tsx`** | [Page object pattern](conventions.md#page-object-pattern) |

## TypeScript, React, CSS

| Always | Never | Details |
| ------ | ----- | ------- |
| **`export const X = (props: XProps) =>`** (arrow); **`src/…`** imports | **`export function`**, barrels under **`src/`**, **`any`**, non-null **`!`** | [conventions → TypeScript](conventions.md#typescript) |
| **`classNames()`**; **`definedProps()`** for optional spreads | **`undefined`** on optional props; template-literal **`className`** | [conventions → React](conventions.md#react--jsx) |
| Mobile-first **`(width >= …)`**; nest **`@media`** under blocks | Top-level **`@media`**, **`margin-top`** (use **`gap`**) | [conventions → CSS](conventions.md#css-and-styling) |
| **`pnpm scaffold`** for new components | Hand-rolled component folders | [components.md → Scaffolding](components.md#scaffolding) |

## Forms and API

| Always | Never | Details |
| ------ | ----- | ------- |
| RHF + **`zodResolver`** + **`useForm<z.infer<typeof schema>>`** | **`z.coerce.*`** on registered fields; resolver casts | [RHF + Zod (non-negotiable)](conventions.md#react-hook-form--zod-typing-non-negotiable) |
| Verified OAuth on private routes; **`privateRouteJson`** pattern | Guessing auth from chat memory | [api-routes.md](api-routes.md), [patterns.md](patterns.md) |

## Finish the turn

| Always | Never | Details |
| ------ | ----- | ------- |
| Update matching **`docs/handbook/*.md`** in the same turn when **`src/`** or test conventions change | Shipping behavior with a stale handbook | [conventions §5](conventions.md#non-negotiables-substantive-work-and-agents) |
| **`pnpm lint:all`** before commit/PR on substantive **`src/`** work | Assuming **`pnpm lint:css`** alone is enough | [AGENTS.md](../../AGENTS.md), workspace lint rule |
| Root **README** when user-facing features, routes, setup, or stack listed there change | Leaving README wrong after product/setup shifts | [agent-workflow.md](agent-workflow.md) |

## Context efficiency (agents)

Keep handbook context small — same discipline as our rhythm-app frontend handbook:

1. **This page first**, then **only** the rows you need from [llms.md](llms.md) — not every chapter, not a full copy of the handbook into the chat.
2. **Read each routed chapter once** per task, even when many changed files map to the same chapter.
3. **Locate before you open** — search (**Grep**, **Glob**) for symbols and filenames; open full files only when the diff or the task requires surrounding context.
4. **Review and blame with diffs** — prefer **`git diff -U20 $(git merge-base HEAD <base>) -- <file>`** over reading entire files; open the whole file only for new files, renames, or cross-file behavior ([handbook-review command](../../.cursor/commands/handbook-review.md)).
5. **Skills on demand** — load **`.cursor/skills/<name>/SKILL.md`** only when **llms.md** or the task routes there; skills point at handbook sections instead of duplicating them.
6. **Stack inspection** — **`st view --json`** and **`git log --oneline <parent>..HEAD`** for layer scope; do not dump full **`git log`** / multi-branch history unless debugging.
7. **Stop-hook dedupe** — [`.cursor/hooks/session-stop-checks.sh`](../../.cursor/hooks/session-stop-checks.sh) nags once per conversation fingerprint; finish handbook sync + **`lint:all`** + **`test:changed`** in the same turn as the last code change when applicable.

Uncertain between two patterns → [decisions.md](decisions.md) first (one page), then back to **llms.md** for depth.