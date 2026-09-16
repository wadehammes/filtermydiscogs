# Agent instructions

**Before any work in this repo**, read **`docs/handbook/README.md`** and the handbook **chapter** that matches the task. Use **`docs/handbook/llms.md`** for a compact task→chapter map (helpful for routing or for pasting into other tools).

Follow documented patterns.

**Test-driven development:** For substantive work, use TDD—write thoughtful, meaningful failing specs **first**, then implement the smallest change that greens them (red → green → refactor). See [conventions.md → Testing → TDD](docs/handbook/conventions.md#test-driven-development-tdd). Do not add behavior in production and treat tests as an afterthought.

**Keep docs accurate:** Whenever a change would make the handbook wrong or incomplete—new flows (CI, env, auth cookies), moved files, component or convention changes, Discogs/Prisma patterns, or anything a future reader would be misled by—update the relevant **`docs/handbook/*.md`** in the **same PR** when practical, or in a small follow-up right away. When the change shifts **user-facing features, routes, setup, or tech stack** listed in the root **[README.md](./README.md)**, update that file too. Do not leave docs stale on purpose.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

<!-- fallow:setup-hooks:start -->
## Fallow (ad-hoc analysis)

**CI dead-code gate:** [`knip.json`](./knip.json) / `pnpm knip:ci` (see [platform.md](docs/handbook/platform.md)). **Fallow** is optional codebase intelligence for agents and local deep dives ([`.fallowrc.jsonc`](./.fallowrc.jsonc), `pnpm fallow:*`). No commit/push hooks are installed in this repo.

Before deleting “unused” code or dependencies, or before large refactors, use the task map below. For changed-file review, `fallow audit --changed-since origin/staging` (`pnpm fallow:audit`) is advisory unless you opt into stricter gating.

## Fallow task map

| When the agent is about to... | Run |
|---|---|
| delete an "unused" export or file | `fallow dead-code --trace <file>:<export>` |
| prove a TypeScript symbol's exact consumers before refactoring | `fallow dead-code --type-aware --symbol-impact <file>:<export-or-class.method>` |
| find how one module reaches another | `fallow trace --path <from> <to>` (Reports `reachable: false` instead of failing when no import path exists; type-only hops are reported, not skipped.) |
| delete an "unused" dependency | `fallow dead-code --trace-dependency <name>` |
| commit or open a PR | `fallow audit --base <ref>` |
| read a diff before approving it | `fallow review --base <ref> --brief` (orientation, never gates: deterministic and always exit 0, unlike the audit row) |
| prioritize refactoring | `fallow health --hotspots --targets` |
| ask who owns code | `fallow health --ownership` |
| check untested-but-reachable code | `fallow health --coverage-gaps` |
| consolidate duplication | `fallow dupes --trace dup:<fingerprint>` |
| find feature flags | `fallow flags` |
| check which architecture rules apply to a file before changing it | `fallow guard <files>` |
| surface security candidates | `fallow security` |
| understand a finding | `fallow explain <issue-type>` |
| scope a monorepo | `--workspace <glob> / --changed-workspaces <ref>` (global flags, prefix any command) |
<!-- fallow:setup-hooks:end -->
