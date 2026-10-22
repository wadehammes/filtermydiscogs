---

name: sentry
description: >-
Triage production errors via Sentry MCP (search issues, issue details, resolve/ignore,
dropped events). Use when investigating Sentry issues, regressions, or alert spikes.
---

# Sentry MCP (this repo)

- **MCP:** [`.cursor/mcp.json`](../../.cursor/mcp.json) — **`sentry`** namespace (HTTP). Endpoint: **`https://mcp.sentry.dev/mcp/filtermydiscogs/javascript-nextjs`** (same slugs as **`SENTRY_ORG`** / **`SENTRY_PROJECT`**).
- **Auth:** OAuth on first use in **Cursor desktop** — **Settings → MCP** → **sentry** → connect / sign in. Cloud agents cannot complete OAuth; authenticate locally, then retry.
- **Runbook:** [platform.md → Sentry runbook](../../docs/handbook/platform.md#sentry-runbook) (saved searches, tags, **`Fixes JAVASCRIPT-NEXTJS-*`** in PRs).

## When to use MCP vs the UI

| Goal                             | MCP tools (discover via MCP tool list after auth)                                       |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| Open backlog / filter production | **`search_issues`** with handbook queries (e.g. `is:unresolved environment:production`) |
| Issue stack, events, metadata    | **`get_sentry_resource`** (issue URL or id)                                             |
| Flat charts / quota              | **`find_dropped_events`**                                                               |
| Triage after fix shipped         | **`update_issue`** (resolve / ignore with reason)                                       |

Prefer MCP for agent-driven triage; use the [issue dashboard](https://filtermydiscogs.sentry.io/issues/?project=javascript-nextjs) for Session Replay and deep event UI.

## Conventions

- Issue short ids in commits/PRs: **`Fixes JAVASCRIPT-NEXTJS-<letter>`** (from the issue URL).
- **`user.visible:true`** and **`client.domain:error_boundary`** = user-facing priority (see runbook tag table).
- Do not confuse Sentry (ops errors) with GTM/product analytics.
