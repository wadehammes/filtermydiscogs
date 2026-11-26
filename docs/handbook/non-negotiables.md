# Non-negotiables

One-page digest every substantive change and agent session follows. Detail lives in topic pages ([testing.md](testing.md), [react.md](react.md), [css.md](css.md)) — read this **before** the first edit, then **llms.md** rows only.

Applies to code you add or rewrite. Legacy code can stay until you touch that area.

## Branches and PRs

| Always | Never | Details |
| ------ | ----- | ------- |
| **`st`** / gh-stack into **`staging`**; plan layers before coding | Parallel **`git checkout -b …`** off **`staging`** for stacked work | [non-negotiables § Branches](#branches-and-prs), [platform.md](platform.md) |
| **`st init`** / **`st create`**, **`st add`**, **`./scripts/git-commit.sh`**, **`st sync`**, **`st ss --auto`** | Raw **`git commit`** in agent sessions (blocked by hooks) | [stacked-prs skill](../../.cursor/skills/stacked-prs/SKILL.md) |

## Tests

| Always | Never | Details |
| ------ | ----- | ------- |
| Failing spec first, then minimal production code | Production first, specs backfilled | [testing.md → TDD](testing.md) |
| **`src/tests/factories/`** + MSW builders | Inline ad-hoc domain objects | [factories.md](factories.md) |
| One top-level **`describe`** per hook spec | Nested **`describe`** | [testing.md → Hook checklist](testing.md) |
| **`api.*`** mocks in **`.po.tsx`** | **`mockApiResponse`** in **`.spec.tsx`** | [testing.md → Page objects](testing.md) |

## TypeScript, React, CSS

| Always | Never | Details |
| ------ | ----- | ------- |
| **`export const`** arrows; **`src/…`** imports | **`export function`**, barrels, **`any`** | [conventions.md](conventions.md), [react.md](react.md) |
| **`classNames()`**, **`definedProps()`** | Template-literal **`className`** | [react.md](react.md) |
| Mobile-first **`(width >= …)`** | Top-level **`@media`** | [css.md](css.md) |
| **`pnpm scaffold`** for new components | Hand-rolled folders | [components.md](components.md) |

## Forms and API

| Always | Never | Details |
| ------ | ----- | ------- |
| RHF + **`zodResolver`** + **`useForm<z.infer<typeof schema>>`** | **`z.coerce.*`** on registered fields | [react-forms.md](react-forms.md) |
| Verified OAuth on private routes | Guessing auth | [api-routes.md](api-routes.md), [patterns.md](patterns.md) |

## Finish the turn

| Always | Never | Details |
| ------ | ----- | ------- |
| Update matching **`docs/handbook/*.md`** when **`src/`** changes | Stale handbook | [agent-workflow.md](agent-workflow.md) |
| **`pnpm lint:all`** before commit/PR | CSS-only lint assuming full gate | [AGENTS.md](../../AGENTS.md) |

## Context efficiency (agents)

1. **This page** → **llms.md** rows only — not the whole handbook.
2. **Each routed chapter once** per task.
3. **Grep/Glob** before opening large files.
4. **`git diff -U20`** for review ([handbook-review](../../.cursor/commands/handbook-review.md)).
5. **Skills on demand** when llms routes there.
6. **`st view --json`** for stack scope.
7. Finish handbook sync + **`lint:all`** + **`test:changed`** same turn when hooks nudge.

Uncertain → [decisions.md](decisions.md) first.