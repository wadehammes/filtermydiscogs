# Handbook review command

Used by [`.cursor/commands/handbook-review.md`](../../.cursor/commands/handbook-review.md). Review only — no edits in the same turn.

**Find changes:** Paths in args → those files + PO/spec pairs. Branch name → diff vs branch. No args → `gh pr view --json baseRefName` (stack parent), else **`staging`**. `git fetch` when needed; `git diff $(git merge-base HEAD <base>)` plus staged/unstaged; include untracked from `git status --porcelain`. Primary scope: **`src/`**, **`.jest/`**, **`jest.config.ts`**, **`e2e/`**, **`playwright.config.ts`**, **`next.config.ts`**, **`docs/handbook/`** when this branch touches docs, **`prisma/`** when schema changes.

**Read chapters:** [non-negotiables.md](non-negotiables.md) first. Route via [llms.md](llms.md) — each chapter once. Hook/util specs → [testing.md](testing.md); components → [testing.md](testing.md) + [components.md](components.md). Load **`.cursor/skills/*/SKILL.md`** only when llms routes there. Skim [hooks README](../../.cursor/hooks/README.md) for edit-guard classes. Prefer **`git diff -U20 $(git merge-base HEAD <base>) -- <file>`**.

**Linters (read-only):** `pnpm exec biome check <files>`; `pnpm lint:css` for CSS.

**Check lines:** TDD, factories, flat hook `describe`, PO mocks, **`st`**, imports, CSS mobile-first, OAuth on private routes, handbook sync when `src/` behavior shifts. Report only **changed** lines.

**Report:** Group by file; link handbook sections; end with linters, clean files, handbook gaps.