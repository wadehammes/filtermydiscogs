---

description: Review branch changes against docs/handbook and AGENTS.md conventions.
argument-hint: "[base branch or file paths]"
---

Review the code this branch changes against the handbooks, and report where it does not follow them. **Do not edit any code or handbook files** in this turn — review only. After the report, the engineer may reply **go** (or ask explicitly) for a separate pass that applies fixes and runs **`pnpm lint:all`**.

## 1. Find the changes

Arguments: **$ARGUMENTS**

- If the arguments are **paths that exist**, review those files and their usual pairs (`.po.tsx`, `.spec.ts(x)`, util extracted from a hook, matching **`docs/handbook/*.md`** section if the path is under `docs/`).
- If the argument is a **branch name**, diff against it.
- With **no arguments**, use the PR base branch (`gh pr view --json baseRefName -q .baseRefName`) so a **stacked** layer diffs against its parent; if there is no PR or **`gh` fails**, use **`staging`**.

Resolve the base ref: use the local branch when it exists, otherwise **`origin/<base>`**. Run **`git fetch origin <base>`** when needed.

Diff from the merge base and include uncommitted work:

- `git diff $(git merge-base HEAD <base>)` for tracked changes (committed + unstaged on tracked files).
- `git diff` and `git diff --cached` for any extra staged/unstaged detail.
- Untracked paths from `git status --porcelain`.

**Keep** changes under:

- **`src/`** (always the primary scope)
- **`.jest/`**, **`jest.config.ts`**, **`e2e/`**, **`playwright.config.ts`**, **`next.config.ts`**
- **`docs/handbook/`** when this branch also changes handbook text (accuracy review, not copy-editing for style)
- **`prisma/`** only when schema/migrations change (pair with [database.md](docs/handbook/database.md))

**Skip** from deep line review unless **`$ARGUMENTS`** asks for them: lockfiles, generated artifacts (`node_modules/`, `.next/`), snapshot-only churn, and pure **`.cursor/`** command/rule edits (unless the diff is the command itself).

If nothing relevant remains after filtering, say so and stop.

## 2. Read the matching chapters

Before judging any line:

1. Route changed paths through **`docs/handbook/llms.md`** and read **every page a changed file maps to** — **each page once**, even when many files share a chapter.
2. **Always** read [non-negotiables.md](docs/handbook/non-negotiables.md) first (includes **st**, TDD, factories, PO mocks). Report a broken non-negotiable before other findings. Canonical detail: [conventions.md → Non-negotiables](docs/handbook/conventions.md#non-negotiables-substantive-work-and-agents).
3. **Always** for TS/React/test diffs, when not covered by the digest:
   - [conventions.md → Hook and feature spec checklist](docs/handbook/conventions.md#hook-and-feature-spec-checklist) when hooks, utils, or specs changed
   - [conventions.md → Page object pattern](docs/handbook/conventions.md#page-object-pattern) when `src/components/**` specs changed
4. Add routed chapters: **`components.md`**, **`patterns.md`**, **`factories.md`**, **`api-routes.md`**, **`database.md`**, **`discogs.md`**, **`data-storage.md`**, **`platform.md`**, etc., per **`llms.md`**.
5. Read project skills when the diff touches those areas (read each **`SKILL.md`** under **`.cursor/skills/`** only as routed — do not load every skill):
   - **`handbook-routing`**, **`hook-feature-specs`**, **`component-and-po-specs`**, **`typescript-react-guardrails`**
   - Domain skills as routed (e.g. **`api-routes`**, **`oauth-and-session`**, **`release-playback`** — playback hooks are never TDD-exempt per handbook)
6. **Edit guard (hooks miss human intent):** Skim [`.cursor/hooks/README.md`](.cursor/hooks/README.md) → **`enforce-handbook-edit.sh`** and blocking **`preToolUse`** hooks. Code written in one shot never hit the guard — check for the same classes of issues:
   - **`jest.mock`** on **`src/hooks/queries/*`** or **`src/hooks/mutations/*`** (mock **`src/api/urls`** instead)
   - **`mockApiResponse`** / API mock wiring in **`.spec.tsx`** instead of **`.po.tsx`**
   - Nested top-level **`describe`** in hook/util specs
   - New **`export function`** in app code (prefer **`export const`** arrows)
   - New code **comments**, hand-created component folders (use **`pnpm scaffold`**), factories outside **`src/tests/factories/`**
7. Read changes with **`git diff -U20 $(git merge-base HEAD <base>) -- <file>`** (enough context to separate new from existing code). Open the **whole** file only when the diff is not enough: new file, rename, or cross-file behavior.

## 3. Run the linters (read-only)

On changed TypeScript/TSX (and CSS if any **`*.module.css`** or global CSS changed):

- **`pnpm exec biome check <changed-files>`** — do **not** pass **`--write`** / **`--fix`**
- If CSS under **`src/`** changed: **`pnpm lint:css`** (no fix flags)

Report Biome/Stylelint/tsc failures in the **Linters** section; do not duplicate each lint as a handbook finding unless the handbook explicitly documents the rule.

Optional sanity (only when the diff is small): **`pnpm handbook:check`** reports handbook/spec-pair drift — mention if it would fail, without fixing.

## 4. Check the changed lines

Check each **added or changed** line against the chapters you read. Look for:

- **Non-negotiables** ([non-negotiables.md](docs/handbook/non-negotiables.md), [conventions.md](docs/handbook/conventions.md)): TDD, **factories**, flat hook **`describe`**, mocks in POs, **`st`** / gh-stack, **`src/…`** imports, **`classNames`** / **`definedProps`**, literal user-visible strings in specs (not re-reading constants from the PO).
- **Tests:** behavior/fix with no spec change; missing **spec pair** for new production modules ([`spec-pair-check.sh`](scripts/spec-pair-check.sh)); integration gaps (priority, dismiss, API outcomes) that unit tests alone do not cover.
- **Components:** watcher toast helper vs component spec split ([components.md → Testing](docs/handbook/components.md#testing)); **`BrowserOnly`** / toast host patterns.
- **Jotai / state:** atoms under **`src/atoms/`** vs feature folders ([patterns.md](docs/handbook/patterns.md)); no duplicate parallel helpers when handbook names one.
- **API / auth:** verified OAuth on private routes ([api-routes.md](docs/handbook/api-routes.md), [patterns.md](docs/handbook/patterns.md)).
- **Client boundaries:** **`"use client"`** on hooks/components that use browser APIs, Jotai, or timers when imported outside a guaranteed client parent.
- **CSS:** mobile-first **`(width >= …)`**, nesting under blocks ([conventions.md → CSS and styling](docs/handbook/conventions.md#css-and-styling)).
- **Copy / privacy:** governed strings in **`userFacingCopy.registry.ts`** / About–Legal when user-facing copy or storage keys change ([data-storage.md](docs/handbook/data-storage.md)).
- **Docs:** when `src/` behavior or test conventions shifted but **`docs/handbook/`** did not, flag as a **process** finding (handbook post-work), not a line violation.

Report only problems on **changed** lines. If new code copies an older pattern already in the file, report **once** and note the file already uses it elsewhere. Do not invent violations the handbook does not cover.

## 5. Report

Group findings by file. For each issue:

- **`path:line`** and the code
- The rule, as a link to the handbook section (e.g. `docs/handbook/conventions.md#page-object-pattern`)
- A short suggested fix (snippet when helpful)

Order: **wrong behavior / missing tests** first, then rule violations, then pattern mismatches, then handbook sync / process.

End with:

- **Linters:** Biome / Stylelint / optional handbook:check outcome, or that they passed on the changed paths.
- **Clean files:** changed files with nothing to report.
- **Handbook gaps:** patterns the handbook does not document or contradicts. Name the section you would update and what you would write; do **not** edit the handbook in this command.

If there are no findings, list which files you checked and which handbook sections (and skills) you used.
