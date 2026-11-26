# FilterMyDisco.gs handbook

This is the **FilterMyDisco.gs handbook**: how the app is structured, how we write code, how Discogs OAuth and the API feed the UI, and where to look when debugging or adding a feature.

Skim the index, bookmark what you need, and come back when you touch that area. **Keep these docs aligned with the repo**—when behavior changes, update the matching page here (or in the same PR) so the next person is not misled.

**For tools and LLMs:** Start at **[non-negotiables.md](non-negotiables.md)** (one page), then **[llms.md](llms.md)** for **task → chapter** routing — read only the rows you need. Use **[decisions.md](decisions.md)** (X vs Y) when unsure which pattern to use. **[AGENTS.md](../../AGENTS.md)** requires handbook-first work.

## How to read this handbook

1. **Orientation** — [architecture.md](architecture.md): stack, folders, and how data gets from Discogs and Postgres to the screen.
2. **Feature areas (why we built it this way)** — [feature-guides/README.md](feature-guides/README.md): human-readable breakdowns, decisions, and code snapshots per product area.
3. **Day-to-day coding** — [conventions.md](conventions.md): TypeScript, React, CSS (Biome + Stylelint), tests (**TDD**, **factories**, flat hook **`describe`** — [Non-negotiables](conventions.md#non-negotiables-substantive-work-and-agents)).
4. **Discogs integration** — [discogs.md](discogs.md): OAuth, API service, username validation, cookies.
5. **Database** — [database.md](database.md): Prisma schema, crates, route handlers.
6. **UI structure** — [components.md](components.md): folders, naming, tests.
7. **App patterns** — [patterns.md](patterns.md): Jotai (filters/view), context providers, React Query, auth flow, public crates.
8. **Operations** — [platform.md](platform.md): CI, env, `next.config`, security headers.
9. **Test data** — [factories.md](factories.md): Faker factories for releases, collections, crates.
10. **Where things live** — [source-layout.md](source-layout.md): `src/app`, `src/components`, hooks, API routes.

## Index of docs

| File                                                                 | What it covers                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [glossary.md](glossary.md)                                           | Domain terms: instance vs release, `track_key`, crates vs playlists, auth/session vocabulary.                    |
| [decisions.md](decisions.md)                                         | **X vs Y** plus **feature playbooks** (filter, API, hook, component, analytics, playback, storage).            |
| [feature-guides/](feature-guides/README.md)                          | **Narrative feature areas**: rationale, tradeoffs, and code examples ([public sharing](feature-guides/public-sharing.md), [client state](feature-guides/client-state.md), …). |
| [non-negotiables.md](non-negotiables.md)                             | **Agents:** rules digest + context/token efficiency — read before the first edit.                             |
| [agent-workflow.md](agent-workflow.md)                               | Agent finish checklist, `pr-prep`, stop hooks, handbook sync, diff-first review.                            |
| [architecture.md](architecture.md)                                   | Tech stack, directory map, data flow, key config. Orientation after decisions.                             |
| [api-routes.md](api-routes.md)                                       | Auth tiers, `api.*` → route map, validation/errors; deep route tables in [database.md](database.md).         |
| [data-storage.md](data-storage.md)                                   | localStorage, IndexedDB, Postgres, clear-data, About/Legal alignment.                                     |
| [conventions.md](conventions.md)                                     | TypeScript, Biome, Stylelint/CSS, Modules, testing, accessibility.                                          |
| [discogs.md](discogs.md)                                             | OAuth 1.0a, `discogs-oauth.service`, username validation, cookies, API errors.                              |
| [database.md](database.md)                                           | Prisma models, crate CRUD, migrations, admin stats.                                                         |
| [components.md](components.md)                                       | Component folder layout, naming, tests.                                                                     |
| [patterns.md](patterns.md)                                           | Jotai atoms, context providers, React Query hooks, filters, auth, public crate pages.                       |
| [playback-embed-invariants.md](playback-embed-invariants.md)         | Embed ↔ queue behavioral contract; maps to `releasePlayback.context.*.spec.tsx` search strings.             |
| [playback-manual-queue.md](playback-manual-queue.md)                 | Manual queue curation vs pending album rebuild; maps to core context specs + manual-queue E2E.              |
| [playback-embed-simplification.md](playback-embed-simplification.md) | Stacked refactor plan (pure embed session → thin hooks).                                                    |
| [platform.md](platform.md)                                           | GitHub CI, **`staging`** / **`main`** rulesets, releases, `pnpm` scripts, `next.config` (env, CSP, images). |
| [factories.md](factories.md)                                         | Test factories: BaseFactory, Faker, KeysMatch, nullish, nested builds.                                      |
| [source-layout.md](source-layout.md)                                 | Module map under `src/` and related folders.                                                                |
| [llms.md](llms.md)                                                   | Task-to-chapter routing; copy-paste blurb for agents.                                                       |

## Development setup

Machine setup (Node, pnpm, Discogs OAuth app, database, first `pnpm dev`) lives in the root **[README.md](../../README.md)** so we do not duplicate it. After you can run the app locally, use this handbook when you change the codebase.
