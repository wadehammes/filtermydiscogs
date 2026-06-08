# Handbook routing (for tools and LLMs)

Choose **which markdown file to read first**. Paths below are relative to **`docs/handbook/`**.

## Task → chapter

| Task or question | Read first |
|------------------|------------|
| Stack, folders, Discogs → UI data flow | [architecture.md](architecture.md) |
| TypeScript / React / Biome / Stylelint / CSS / tests | [conventions.md](conventions.md) |
| OAuth login, Discogs API, username format, cookies | [discogs.md](discogs.md) |
| Collection notes (read/write, card UI, search) | [discogs.md](discogs.md) (API) + [patterns.md](patterns.md) (provider) + [components.md](components.md) (`ReleaseNotes/`) |
| Crates, Prisma, Postgres, crate API routes | [database.md](database.md) |
| Component folders, naming, tests | [components.md](components.md) |
| Public landing, login page, `PublicAuthLayout` | [components.md](components.md) + [patterns.md](patterns.md) (auth flow) |
| Contexts, filters, React Query, auth, public crates | [patterns.md](patterns.md) |
| CI, scripts, `next.config`, env, CSP | [platform.md](platform.md) |
| Test factories, Faker, `build()` / `buildList()` | [factories.md](factories.md) |
| Where a file category lives under `src/` | [source-layout.md](source-layout.md) |

## Outside this folder

| Task | Location |
|------|----------|
| Install Node/pnpm, Discogs app, database, first run | Repo root **[README.md](../../README.md)** |
| Agent defaults, handbook sync | **[CLAUDE.md](../../CLAUDE.md)**, **[AGENTS.md](../../AGENTS.md)** |

## Suggested instruction blurb (copy-paste)

```text
Before substantive edits, read docs/handbook/README.md and the chapter that matches the task (see docs/handbook/llms.md for a task→chapter map). When your change affects behavior, setup, or conventions, update the relevant docs/handbook/*.md in the same PR or an immediate follow-up so the handbook stays accurate.
```
