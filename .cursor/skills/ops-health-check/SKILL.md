---

name: ops-health-check
description: >-
Operational health sweep for filtermydiscogs — Dependabot/GitHub security, pnpm audit,
Sentry production backlog, and local pr-prep gates; fix findings on a staging PR.
Use when the user asks for ops health, security health check, Dependabot, or agent maintenance PRs.
---

# Ops health check (this repo)

Combines **automated snapshots** (shell) with **agent triage** (Sentry MCP) and **merge gates** (`mise run pr-prep`). Distinct from **`mise run pr-prep`** alone (code quality) and **`pnpm fallow:health`** (complexity score).

## Quick start (user says “run ops health”)

1. **Snapshot** (required): `mise run ops-health` or `bash scripts/ops-health-check.sh`
2. **Sentry** (required when MCP authenticated): load [sentry/SKILL.md](../sentry/SKILL.md), then `search_issues` with  
   `is:unresolved environment:production` — skim handbook [platform.md → Sentry runbook](../../docs/handbook/platform.md#sentry-runbook) for ignorable third-party noise.
3. **Fix** security/npm items first (see below), then **regressions** you can reproduce in code.
4. **Validate**: `mise run pr-prep` (or `mise run ci` before large changes).
5. **PR**: only when the user asks — branch off **`staging`**, title/body list alerts closed; Dependabot fixes cite `GHSA-*`; Sentry fixes cite `Fixes JAVASCRIPT-NEXTJS-*`. Use [stacked-prs/SKILL.md](../stacked-prs/SKILL.md) or `gh pr create` per user rules.

## What the shell script covers

| Signal                               | Source                       | Fix owner                                |
| ------------------------------------ | ---------------------------- | ---------------------------------------- |
| Open Dependabot                      | `gh api …/dependabot/alerts` | Agent — override or bump deps            |
| npm advisories                       | `pnpm audit`                 | Agent — align with Dependabot            |
| Transitive `deprecated:` in lockfile | `pnpm-lock.yaml`             | Report only unless upgrade path is clear |
| Peer drift                           | `pnpm peers check`           | Report; fix only when breaking           |

**Not in script:** Sentry (OAuth MCP), Vercel runtime logs, GitHub Actions failures — agent tools.

Flags: `--json` for structured output; `--strict` treats audit failures strictly (default already fails on high/critical Dependabot + non-zero audit).

## Fixing Dependabot / `pnpm audit` (patterns)

1. `pnpm why <package>` — direct dep vs transitive.
2. **Direct**: bump in `package.json`, `pnpm install`, tests.
3. **Transitive** (common: Prisma → `effect`): add minimum to [`pnpm-workspace.yaml`](../../pnpm-workspace.yaml) **`overrides`** (document in [platform.md → pnpm overrides](../../docs/handbook/platform.md#pnpm-overrides-transitive-security)).
4. Re-run `bash scripts/ops-health-check.sh` until PASS; confirm alert closes on GitHub after merge (or comment alert # in PR).
5. Remove overrides when every path natively pulls a patched version.

## Sentry triage rules

- **Fix in app** when stack traces point at `src/` and the issue is new or regressed.
- **Do not “fix”** handbook-documented `beforeSend` drops (appendChild, GTM, third-party).
- **Resolve in Sentry** via MCP `update_issue` only after the fix ships (or with ignore reason for accepted noise).

## Report template (post-run)

```markdown
## Ops health — <date>

### Automated

- Dependabot: <count> open (<list or “none”>)
- pnpm audit: <pass/fail summary>
- Lockfile deprecated markers: <n>

### Sentry (production, unresolved)

- <issue id> — <one line> — action: fix / ignore / monitor

### Changes in this PR

- <bullet per GHSA or Sentry id>

### Verification

- [ ] `mise run pr-prep`
- [ ] `bash scripts/ops-health-check.sh`
```

## Related

- Code health: `mise run pr-prep`, `pnpm fallow:health`
- CI parity: `mise run ci`
- Autopilot loop (comments/CI on existing PR): personal `autopilot` skill
