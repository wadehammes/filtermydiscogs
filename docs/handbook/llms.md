# Handbook routing (for tools and LLMs)

Choose **which markdown file to read first**. Paths below are relative to **`docs/handbook/`**.

## Task → chapter

| Task or question | Read first |
|------------------|------------|
| Stack, folders, Discogs → UI data flow | [architecture.md](architecture.md) |
| TypeScript / React / Biome / Stylelint / CSS / tests | [conventions.md](conventions.md) |
| CSS Modules nesting, mobile-first breakpoints, modern CSS | [conventions.md](conventions.md) (CSS and styling) |
| OAuth login, Discogs API, username format, cookies | [discogs.md](discogs.md) |
| Collection notes (read/write, card UI, search) | [discogs.md](discogs.md) (API) + [patterns.md](patterns.md) (provider) + [components.md](components.md) (`ReleaseNotes/`) |
| Release detail / tracklist / in-app playback | [discogs.md](discogs.md) (API) + [components.md](components.md) (`ReleaseModal/`, `ReleasePlayback/`) + [patterns.md](patterns.md) (`ReleasePlaybackProvider`) + [source-layout.md](source-layout.md) |
| Crates, Prisma, Postgres, crate API routes | [database.md](database.md) |
| Component folders, naming, tests | [components.md](components.md) |
| Public landing, login page, `PublicAuthLayout` | [components.md](components.md) + [patterns.md](patterns.md) (auth flow) |
| Filters, view mode, Jotai atoms, contexts, React Query, auth, public crates | [patterns.md](patterns.md) · stack detail in [architecture.md](architecture.md) |
| Crate drawer defaults, login drawer reset, sidebar vs mobile shell | [patterns.md](patterns.md) (Crates) + [conventions.md](conventions.md) (Testing → `setupMockMatchMedia`) |
| Dashboard / collection analytics | [patterns.md](patterns.md) (Dashboard analytics) + [components.md](components.md) (`Dashboard/`) |
| Mosaic generator / image proxy | [patterns.md](patterns.md) (Mosaic generator) |
| Clear user data (Settings / About / Legal) | [discogs.md](discogs.md) + [patterns.md](patterns.md) (Clear stored data) |
| Settings page (theme, sync, clear data) | [patterns.md](patterns.md) + [components.md](components.md) (`Settings/`) |
| CI, Knip, scripts, `next.config`, env, CSP | [platform.md](platform.md) |
| Private session API cache headers, `proxy.ts`, `privateRouteJson` | [platform.md](platform.md) + [database.md](database.md) (crate routes) |
| Test factories, Faker, `build()` / `buildList()` | [factories.md](factories.md) |
| Jest setup, PO mocks, `TestProviders`, API route tests, query-hook stubs | [conventions.md](conventions.md) (Testing) |
| Agent / LLM workflow, keeping docs in sync | **[AGENTS.md](../../AGENTS.md)**, **[CLAUDE.md](../../CLAUDE.md)** |
| Where a file category lives under `src/` | [source-layout.md](source-layout.md) |

## Outside this folder

| Task | Location |
|------|----------|
| Install Node/pnpm, Discogs app, database, first run | Repo root **[README.md](../../README.md)** |

## Suggested instruction blurb (copy-paste)

```text
Before any work, read docs/handbook/README.md and the chapter that matches the task (see docs/handbook/llms.md for a task→chapter map). Follow documented patterns. When your change affects behavior, setup, or conventions, update the relevant docs/handbook/*.md in the same PR or an immediate follow-up so the handbook stays accurate.
```
