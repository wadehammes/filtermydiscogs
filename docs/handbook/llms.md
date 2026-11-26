# Handbook routing

Which page to read before a task. People start at [README.md](README.md). Paths are relative to `docs/handbook/` unless they name `src/` or a root file.

| Task or file | Read first |
| ------------ | ---------- |
| Any substantive change, before anything else | [non-negotiables.md](non-negotiables.md) |
| Unsure which pattern fits | [decisions.md](decisions.md) |
| Feature rationale (playback, sharing, crates, …) | [feature-guides/README.md](feature-guides/README.md) |
| Stack, folders, data flow skim | [architecture.md](architecture.md) |
| `*.ts` (types, utils, services) | [conventions.md](conventions.md) |
| `*.tsx`, `src/hooks/**` | [react.md](react.md) |
| `*.module.css`, `src/styles/**` | [css.md](css.md) |
| `*.spec.ts(x)`, `*.po.tsx`, TDD | [testing.md](testing.md) |
| `src/tests/factories/**` | [factories.md](factories.md) |
| `src/components/**` | [components.md](components.md) |
| Filters, providers, React Query, auth | [patterns.md](patterns.md) |
| `src/app/api/**`, `src/api/**` | [api-routes.md](api-routes.md) → [database.md](database.md) |
| OAuth, Discogs API, cookies | [discogs.md](discogs.md) |
| Prisma, crates, DB routes | [database.md](database.md) |
| Playback / embed / manual queue | [playback-embed-invariants.md](playback-embed-invariants.md), [playback-manual-queue.md](playback-manual-queue.md) |
| Browser storage, privacy copy | [data-storage.md](data-storage.md) |
| `package.json`, CI, env, `next.config`, hooks | [platform.md](platform.md) |
| `src/utils/**`, `src/lib/**`, module map | [source-layout.md](source-layout.md) |
| Agent finish, hooks, token efficiency | [agent-workflow.md](agent-workflow.md), [AGENTS.md](../../AGENTS.md) |
| Stacked PRs (`st`, gh-stack) | [platform.md](platform.md), [stacked-prs skill](../../.cursor/skills/stacked-prs/SKILL.md) |
| Sentry / production errors | [platform.md](platform.md), [sentry skill](../../.cursor/skills/sentry/SKILL.md) |
| Domain term | [glossary.md](glossary.md) |
| Finishing a task or hook blocked an edit | [agent-workflow.md](agent-workflow.md) |

Setup and first run: root [README.md](../../README.md). Extended task→chapter notes (merged rows): [llms-routing-notes.md](llms-routing-notes.md).