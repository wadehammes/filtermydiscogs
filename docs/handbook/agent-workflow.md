# Agent workflow

Checklist for **tools and LLMs** working in this repo—complements [AGENTS.md](../../AGENTS.md) and Cursor **stop** hooks.

## Before the first edit

1. Read [non-negotiables.md](non-negotiables.md) (rules + **context efficiency** — do not load the full handbook up front).
2. Open [llms.md](llms.md) → read **only the matching rows** for your task (each linked chapter **once** per task).
3. For “which pattern?” questions, read [decisions.md](decisions.md) first.
4. Reuse existing hooks, components, and `api.*`—no parallel implementations.

Unfamiliar with the repo? Skim the [README.md](README.md) index for orientation — not required every session.

## While implementing

| Concern | Handbook |
| ------- | -------- |
| Branches / PRs | [conventions.md → Non-negotiables §8](conventions.md#non-negotiables-substantive-work-and-agents) + [platform.md → Stacked pull requests](platform.md#stacked-pull-requests-st) — **`st`** / gh-stack; plan layers before the first edit |
| Tests | [conventions.md → Non-negotiables](conventions.md#non-negotiables-substantive-work-and-agents) (TDD, factories, flat hook `describe`, mocks in POs) |
| CSS / layout | [conventions.md](conventions.md) mobile-first, Stylelint nesting |
| New API | [api-routes.md](api-routes.md) + [database.md](database.md) |
| Storage / privacy | [data-storage.md](data-storage.md) |

## Before you finish (same turn as last code change)

1. **Handbook** — If `src/`, test layout, CI, hooks, or conventions changed, update the matching **`docs/handbook/*.md`** ([llms.md](llms.md)). If nothing was wrong, name the **section headings** you verified.
2. **README** — If user-facing features, routes, setup, or tech stack listed there changed, update root [README.md](../../README.md).
3. **Local checks** (substantive `src/` work):

   ```sh
   mise run pr-prep   # lint:all, handbook:check (includes handbook:audit), test:changed, fallow audit — preferred before PR
   ```

   Targeted alternatives: `pnpm lint:all`, `pnpm handbook:check`, `pnpm test:changed`.

## Cursor stop hook (one follow-up per turn)

[`.cursor/hooks/session-stop-checks.sh`](../../.cursor/hooks/session-stop-checks.sh) may prompt you to:

- Sync handbook when `src/` changed without `docs/handbook/*.md`
- Run **`pnpm lint:all`** after substantive edits (deduped per conversation)
- Run **`handbookTestRules.spec.ts`** when feature test files changed
- Nudge README, terms/privacy, Prisma generate, login-copy Jest, or **`test:changed`** (FMD-specific sections)

Dedupe state: **`.cursor/hooks-state/`** (gitignored); fingerprint hashes **changed file contents**, not only paths (fixes inside an already-edited file re-run lint/Jest nags). Legacy standalone stop scripts are **not** wired in `hooks.json`; see [`.cursor/hooks/README.md`](../../.cursor/hooks/README.md).

**`enforce-handbook-edit`:** Denies only **new** violations introduced by the edit (`newHandbookViolations` in [`handbookEditGuard.ts`](../../src/tests/utils/handbookEditGuard.ts)) — editing near legacy violations does not block. **`nested-describe`** ignores multiline **`import { … }`** lines (`describe,`); if blocked incorrectly, fix the guard in [`handbookEditGuard.spec.ts`](../../src/tests/utils/handbookEditGuard.spec.ts) — do not strip **`afterAll`** / **`jest`** imports.

## Analysis tools (optional)

| Goal | Command / tool |
| ---- | ---------------- |
| Dead code / impact before delete | `pnpm fallow:dead-code`, `pnpm fallow:audit` — map in [AGENTS.md](../../AGENTS.md) |
| Unsure which chapter applies | [decisions.md](decisions.md) → [llms.md](llms.md) |
| Production errors | [platform.md → Sentry runbook](platform.md#error-monitoring-sentry), Sentry MCP skill |

## Stacked PRs

Trunk **`staging`**. All substantive work: **gh-stack** via **`st`** — [non-negotiables.md → Branches](non-negotiables.md#branches-and-prs), [platform.md → Stacked pull requests](platform.md#stacked-pull-requests-st).

## Context efficiency (tokens)

Same patterns as rhythm-app’s frontend handbook (compact digest, thin routing, diff-first review):

| Do | Avoid |
| -- | ----- |
| [non-negotiables.md](non-negotiables.md) + targeted **llms.md** table rows (not the whole file) | Pasting entire **conventions.md** / **patterns.md** when one section link suffices |

**Token budgets (CI):** `handbookTokenBudgets.spec.ts` in `pnpm handbook:audit`. Aspirational target ~2k for `AGENTS.md` + `llms.md` table rows (enforced with headroom until the routing table is shortened); ~1.5k per handbook page with **grandfathered** mega-chapters until topical splits land.
| **Grep** / **Glob** to find symbols, then open one file | Broad directory reads and huge file dumps into the thread |
| **`git diff -U20 $(git merge-base HEAD <base>) -- path`** for review | Whole-file reads when the diff is enough ([handbook-review](../../.cursor/commands/handbook-review.md)) |
| **`st view --json`**, short **`git log parent..HEAD`** for stack scope | Full **`git log`**, repeating **`st view`** every turn |
| Load a **`.cursor/skills/*/SKILL.md`** only when **llms.md** routes there | Pulling every skill into context “just in case” |
| One handbook chapter per topic **per task** | Re-reading the same chapter for each file in a batch edit |

**`/handbook-review`:** default base is the PR’s parent branch (`gh pr view --json baseRefName`) so stacked layers compare to the branch below — not always **`staging`**.
