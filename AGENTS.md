# Agent instructions

Before substantive work, read **`docs/handbook/non-negotiables.md`**, then **only** the matching rows in **`docs/handbook/llms.md`** (table only — not the whole handbook). When unsure which pattern to use, read **`docs/handbook/decisions.md`**. Context efficiency: [agent-workflow.md → Context efficiency](docs/handbook/agent-workflow.md#context-efficiency-tokens).

Follow documented patterns.

**Testing:** [testing.md](docs/handbook/testing.md) + [factories.md](docs/handbook/factories.md) — TDD, factories, flat hook `describe`, API mocks in POs (not in `.spec.tsx`).

**Docs:** Update matching **`docs/handbook/*.md`** in the same PR when behavior or conventions change; update root [README.md](./README.md) when user-facing features, routes, setup, or stack change. **`pnpm handbook:check`** and **`mise run pr-prep`** before a PR.

**Stacked PRs:** **`st`** / gh-stack on **`staging`** — [platform.md](docs/handbook/platform.md), [stacked-prs skill](./.cursor/skills/stacked-prs/SKILL.md).

**Fallow / ops:** [agent-workflow-fallow.md](docs/handbook/agent-workflow-fallow.md); Sentry — [sentry skill](./.cursor/skills/sentry/SKILL.md).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->