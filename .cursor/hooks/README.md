# Cursor hooks

Project hooks that keep agent work aligned with `docs/handbook/`.

Config: [`.cursor/hooks.json`](../hooks.json). Scripts: [`.cursor/hooks/`](./).

Shared team files under `.cursor/` are tracked in git (`hooks.json`, `hooks/`, `rules/`, `skills/`). Local/runtime Cursor state (`*.log`, `settings.local.json`, checkpoints, etc.) stays gitignored — [`.cursor/mcp.json`](../../.cursor/mcp.json) is committed. See root [`.gitignore`](../../.gitignore).

## Cursor hook events

| Event | Role in this repo |
|-------|-------------------|
| `sessionStart` | One-line handbook pointer (`session-handbook-routing.sh`) |
| `preToolUse` | Blocking guardrails (CSS, factories, scaffold, query-hook mocks, …) |
| `postToolUse` | Advisory checks (e.g. CSS nesting depth) |
| `beforeShellExecution` | Git safety (destructive git, raw `git commit`) |
| `stop` | Drift checks, targeted Jest, `pnpm lint:all` follow-ups |

## Hooks

| Script | Event | What it does |
|--------|-------|--------------|
| `session-handbook-routing.sh` | `sessionStart` | One-line pointer to `docs/handbook/` and `llms.md` (does not inject the full routing table). |
| `handbook-adherence-reminder.sh` | *(off)* | Per-prompt handbook nudge — **not wired** in `hooks.json` (redundant with AGENTS.md + always-on rule). Re-enable under `beforeSubmitPrompt` if needed. |
| `block-co-authored-by-commit.sh` | `beforeShellExecution` (`git commit`) | Denies raw `git commit` (agents must use `scripts/git-commit.sh` or `git -c core.hooksPath=.githooks commit`) and blocks `Co-authored-by` in the command string. |
| `block-destructive-git.sh` | `beforeShellExecution` (`git push`, `git reset`, `git clean`) | Denies force push to **`main`** / **`staging`**, **`git reset --hard`**, and **`git clean -f…`**. |
| `block-added-comments.sh` | `preToolUse` | Denies edits that add code comments. |
| `block-toplevel-media.sh` | `preToolUse` | Denies top-level `@media` in CSS — nest inside selectors. |
| `block-custom-media.sh` | `preToolUse` | Denies `@custom-media` / `@media (--var)` — use range syntax. |
| `block-margin-top.sh` | `preToolUse` | Denies `margin-top` in CSS (use flex `gap`); ignores `margin-top: 0` and `scroll-margin-top`. |
| `block-placeholder-names.sh` | `preToolUse` | Denies generic placeholder names (`raw`, `tmp`, `val`, `foo`, etc.) in TS/TSX bindings and params. |
| `enforce-scaffold.sh` | `preToolUse` (`Write`) | Steers new components through `pnpm scaffold <Name>`. |
| `block-barrel-files.sh` | `preToolUse` (`Write`) | Denies new `index.ts`/`index.tsx` barrels under `src/`. |
| `enforce-factory-location.sh` | `preToolUse` (`Write`) | Denies `*.factory.ts` outside `src/tests/factories/`. |
| `handbook-sync-nudge.sh` | *(off)* | Per-edit docs/skills reminder — **not wired** in `hooks.json` (too noisy during coding). Script kept for optional re-enable. |
| `check-css-nesting.sh` | `postToolUse` | Advisory when CSS nests selectors 4+ levels deep. |
| `handbook-drift-check.sh` | `stop` | One follow-up if `src/` changed without a handbook update and/or product/setup surfaces changed without **README.md**. Suggests chapter filenames from changed paths; requires explicit verification or doc edits (see script). |
| `terms-and-privacy-drift-check.sh` | `stop` | One follow-up if storage/data-management code changed without an About/Legal update. |
| `block-login-page-copy-violations.sh` | `preToolUse` | Denies login landing copy edits that add em dashes, embellishment, or banned inaccurate phrases. |
| `block-query-hook-mocks.sh` | `preToolUse` | Denies specs under `src/hooks/queries/` or `src/hooks/mutations/`, and feature-test edits that mock those hooks instead of `src/api/urls`. |
| `login-page-copy-drift-check.sh` | `stop` | Runs login page literary-rule Jest tests when landing copy source files changed (via **`mise exec -- pnpm`**). |
| `handbook-test-drift-check.sh` | `stop` | Runs handbook testing rule Jest tests (`handbookTestRules.spec.ts`) when feature test files changed (via **`mise exec -- pnpm`**). |
| `prisma-generate-nudge.sh` | `stop` | One follow-up when **`prisma/schema.prisma`** changed — run **`pnpm db:generate`**. |
| `lint-all-check.sh` | `stop` | Runs **`pnpm lint:all`** when the session changed meaningful source ( **`src/**`**, Prisma, lockfile, `package.json`, `next.config`) and follow up once on failure. |

## Project skills and rules

| Path | Role |
|------|------|
| [`.cursor/skills/README.md`](../skills/README.md) | Task skills index (handbook routing, API, tests, factories, feature verticals, `st`, Fallow). |
| [`.cursor/rules/`](../rules/) | Glob rules: CSS modules, API routes, hook/component specs (+ always-on handbook rule). |
| [`.zed/settings.json`](../../.zed/settings.json) | Zed: vtsls **`tsdk`** + CSS Modules **`composes`** custom data (team editor; not Cursor). |

### Optional scripts (not wired)

- **Inline PreToolUse handbook reminder** — covered by always-on rule in `.cursor/rules/` + **AGENTS.md**; optional `beforeSubmitPrompt` script is disabled (`handbook-adherence-reminder.sh`, `handbook-sync-nudge.sh`).

## Requirements

- `bash`, `jq`, `git` on `PATH`
- Hook scripts must be executable (`chmod +x .cursor/hooks/*.sh`)

## Adding or changing a hook

1. Add or edit a script under `.cursor/hooks/` (read JSON from **stdin**; use `_lib.sh` helpers).
2. Wire it in `.cursor/hooks.json` with the right event and matcher.
3. `chmod +x` the script and document it in the table above.
4. Blocking hooks return `{ "permission": "deny", ... }` on `preToolUse`; advisory hooks return `{ "additional_context": "..." }` on `postToolUse`; `stop` uses `{ "followup_message": "..." }`.

Debug via Cursor **Settings → Hooks** or the **Hooks** output channel. Reload happens on `hooks.json` save; restart Cursor if hooks do not pick up.
