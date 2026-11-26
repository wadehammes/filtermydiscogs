# Agent instructions

**Before any work in this repo**, read **`docs/handbook/non-negotiables.md`**, then **only** the matching rows in **`docs/handbook/llms.md`** — do not load the whole handbook. When unsure which pattern to use, read **`docs/handbook/decisions.md`** first. **Context efficiency:** search before opening large files; prefer **`git diff -U20`** from the merge base for review; read each routed chapter **once** per task ([agent-workflow.md → Context efficiency](docs/handbook/agent-workflow.md#context-efficiency-tokens)).

Follow documented patterns.

**Testing (substantive work):** Follow [conventions.md → Non-negotiables](docs/handbook/conventions.md#non-negotiables-substantive-work-and-agents)—**TDD** (red before production code), **factories** for all domain/API test data ([factories.md](docs/handbook/factories.md)), **one flat `describe`** per hook spec ([checklist](docs/handbook/conventions.md#hook-and-feature-spec-checklist)), and **API mocks in POs** (not in **`.spec.tsx`**) for component tests. Do not implement hooks first and backfill specs. **All code in the diff** (production and tests) must follow handbook conventions and documented patterns. Re-read the diff against the routed chapters before finishing, and don't copy a file's legacy style when it contradicts the handbook.

**Keep docs accurate:** Whenever a change would make the handbook wrong or incomplete—new flows (CI, env, auth cookies), moved files, component or convention changes, Discogs/Prisma patterns, or anything a future reader would be misled by—update the relevant **`docs/handbook/*.md`** in the **same PR** when practical, or in a small follow-up right away. When the change shifts **user-facing features, routes, setup, or tech stack** listed in the root **[README.md](./README.md)**, update that file too. Do not leave docs stale on purpose. CI runs **`pnpm handbook:check`** ([`handbook-sync-check.sh`](./scripts/handbook-sync-check.sh) + [`spec-pair-check.sh`](./scripts/spec-pair-check.sh) for playback/utils/hooks); the **stop** hook [`session-stop-checks.sh`](./.cursor/hooks/session-stop-checks.sh) nudges handbook/README/spec pairing, **`lint:all`**, and **`test:changed`** on uncommitted work (one combined follow-up per turn; deduped per conversation). Locally use **`mise run pr-prep`** (**`lint:all`**, **`handbook:check`**, **`test:changed`**, Fallow audit) before opening a PR.

**Stacked PRs (non-negotiable):** All substantive work uses **gh-stack** via **`st`** ([conventions.md → Non-negotiables §8](docs/handbook/conventions.md#non-negotiables-substantive-work-and-agents)) — plan layers first; **`st init`** / **`st create`** for the bottom branch (even single-layer work); **`st add`** for each dependent layer; commit with **`./scripts/git-commit.sh`**; **`st sync`**, **`st ss --auto`**. Trunk **`staging`**. Do not cut standalone feature branches off **`staging`** when the task belongs on a stack; see [platform.md → Stacked pull requests](docs/handbook/platform.md#stacked-pull-requests-st) and [`.cursor/skills/stacked-prs/SKILL.md`](./.cursor/skills/stacked-prs/SKILL.md).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## Sentry MCP (issue triage)

Use [`.cursor/skills/sentry/SKILL.md`](./.cursor/skills/sentry/SKILL.md) and [platform.md → Sentry runbook](docs/handbook/platform.md#sentry-runbook). OAuth once in Cursor desktop (**Settings → MCP → sentry**).

## Resend MCP (email / deliverability)

Hosted server in [`.cursor/mcp.json`](./.cursor/mcp.json) (`https://mcp.resend.com/mcp`). OAuth once in Cursor desktop (**Settings → MCP → resend**), or run **`/add-plugin resend`** for the official plugin + Resend skills. App env: [platform.md → Environment variables](docs/handbook/platform.md) (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`); local smoke: **`pnpm email:send:test`**.

## Ops health (security + Sentry)

| When the agent is about to…                           | Run                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sweep Dependabot, `pnpm audit`, and production Sentry | `mise run ops-health` (or `pnpm ops:health`) then [`.cursor/skills/ops-health-check/SKILL.md`](./.cursor/skills/ops-health-check/SKILL.md) — fix on a **`staging`** PR; re-run script until `pnpm audit` is clean (Dependabot alerts close after merge). |

<!-- fallow:setup-hooks:start -->
## Fallow (ad-hoc analysis)

**CI dead-code gate:** [`knip.json`](./knip.json) / `pnpm knip:ci` (see [platform.md](docs/handbook/platform.md)). **Fallow** in CI: `pnpm fallow:audit:ci` is **advisory** (reports complexity vs the base ref, does not fail the job); local **`pnpm fallow:audit`** / **`mise run pr-prep`** still use **new-only** (introduced findings can fail). No commit/push hooks are installed in this repo.

Before deleting “unused” code or dependencies, or before large refactors, use the task map below. For changed-file review, `fallow audit --changed-since origin/staging` (`pnpm fallow:audit`) is advisory unless you opt into stricter gating.

## Fallow task map

| When the agent is about to...                                     | Run                                                                                                                                                     |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delete an "unused" export or file                                 | `fallow dead-code --trace <file>:<export>`                                                                                                              |
| prove a TypeScript symbol's exact consumers before refactoring    | `fallow dead-code --type-aware --symbol-impact <file>:<export-or-class.method>`                                                                         |
| find how one module reaches another                               | `fallow trace --path <from> <to>` (Reports `reachable: false` instead of failing when no import path exists; type-only hops are reported, not skipped.) |
| delete an "unused" dependency                                     | `fallow dead-code --trace-dependency <name>`                                                                                                            |
| commit or open a PR                                               | `fallow audit --base <ref>`                                                                                                                             |
| read a diff before approving it                                   | `fallow review --base <ref> --brief` (orientation, never gates: deterministic and always exit 0, unlike the audit row)                                  |
| prioritize refactoring                                            | `fallow health --hotspots --targets`                                                                                                                    |
| ask who owns code                                                 | `fallow health --ownership`                                                                                                                             |
| check untested-but-reachable code                                 | `fallow health --coverage-gaps`                                                                                                                         |
| consolidate duplication                                           | `fallow dupes --trace dup:<fingerprint>`                                                                                                                |
| find feature flags                                                | `fallow flags`                                                                                                                                          |
| check which architecture rules apply to a file before changing it | `fallow guard <files>`                                                                                                                                  |
| check import cycles or boundary rules after changing code         | `fallow architecture`                                                                                                                                   |
| surface security candidates                                       | `fallow security`                                                                                                                                       |
| understand a finding                                              | `fallow explain <issue-type>`                                                                                                                           |
| scope a monorepo                                                  | `--workspace <glob> / --changed-workspaces <ref>` (global flags, prefix any command)                                                                    |
<!-- fallow:setup-hooks:end -->
