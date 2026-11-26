| Jest setup, PO mocks, `TestProviders`, API route tests, TDD workflow                           | [conventions.md](conventions.md) (Testing)                                                                                                                                                                                                         |
| MSW 3, `jest-fixed-jsdom`, `.jest/` polyfills, `mswFetchTestHelpers`, Playwright `msw.fixture` | [conventions.md](conventions.md) (Jest notes → MSW) + [platform.md](platform.md) (Jest, Playwright) + [factories.md](factories.md) (`mswFetchTestHelpers`)                                                                                         |
| Agent / LLM workflow, keeping docs in sync                                                     | [agent-workflow.md](agent-workflow.md), **[AGENTS.md](../../AGENTS.md)**, [`.cursor/rules/`](../../.cursor/rules/), [`.cursor/skills/`](../../.cursor/skills/)                                                                                    |
| Fix failing CI / interpret `handbook:check` / spec-pair                                          | [platform.md](platform.md) (CI, scripts) + [agent-workflow.md](agent-workflow.md)                                                                                                                                                                    |
| Debug OAuth or session locally                                                                   | [discogs.md](discogs.md) + [api-routes.md](api-routes.md) (auth tiers)                                                                                                                                                                             |
| Sentry / production investigation                                                                | [platform.md](platform.md#error-monitoring-sentry) + [`.cursor/skills/sentry/SKILL.md`](../../.cursor/skills/sentry/SKILL.md)                                                                                                                     |
| Cursor hooks, rules, skills, MCP; Zed `.zed/settings.json`                                     | [platform.md](platform.md) (Cursor (agents), TypeScript bullet) + [`.cursor/skills/README.md`](../../.cursor/skills/README.md) + [`.cursor/hooks/README.md`](../../.cursor/hooks/README.md)                                                        |
| Where a file category lives under `src/`                                                       | [source-layout.md](source-layout.md)                                                                                                                                                                                                               |

## Outside this folder

| Task                                                | Location                                   |
| --------------------------------------------------- | ------------------------------------------ |
| Install Node/pnpm, Discogs app, database, first run | Repo root **[README.md](../../README.md)** |

## Suggested instruction blurb (copy-paste)

```text
Before any work, read docs/handbook/non-negotiables.md, then only the matching rows in docs/handbook/llms.md (do not load the whole handbook). When unsure which pattern to use, read docs/handbook/decisions.md first. Follow documented patterns. When your change affects behavior, setup, or conventions, update the relevant docs/handbook/*.md in the same PR or an immediate follow-up so the handbook stays accurate. When user-facing features, routes, setup, or tech stack listed in the root README change, update README.md too. For reviews, use git diff -U20 from the merge base; open full files only when the diff is not enough.
```

