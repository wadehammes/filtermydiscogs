# FilterMyDisco.gs handbook

This is the **FilterMyDisco.gs handbook**: how the app is structured, how we write code, how Discogs OAuth and the API feed the UI, and where to look when debugging or adding a feature.

Skim the index, bookmark what you need, and come back when you touch that area. **Keep these docs aligned with the repo**—when behavior changes, update the matching page here (or in the same PR) so the next person is not misled.

**For tools and LLMs:** **[llms.md](llms.md)** has a compact **task → chapter** map and a short copy-paste instruction blurb.

## How to read this handbook

1. **Orientation** — [architecture.md](architecture.md): stack, folders, and how data gets from Discogs and Postgres to the screen.
2. **Day-to-day coding** — [conventions.md](conventions.md): TypeScript, React, CSS (Biome + Stylelint), tests.
3. **Discogs integration** — [discogs.md](discogs.md): OAuth, API service, username validation, cookies.
4. **Database** — [database.md](database.md): Prisma schema, crates, route handlers.
5. **UI structure** — [components.md](components.md): folders, naming, tests.
6. **App patterns** — [patterns.md](patterns.md): contexts, React Query, filtering, auth flow, public crates.
7. **Operations** — [platform.md](platform.md): CI, env, `next.config`, security headers.
8. **Test data** — [factories.md](factories.md): Faker factories for releases, collections, crates.
9. **Where things live** — [source-layout.md](source-layout.md): `src/app`, `src/components`, hooks, API routes.

## Index of docs

| File | What it covers |
|------|----------------|
| [architecture.md](architecture.md) | Tech stack, directory map, data flow, key config. Start here. |
| [conventions.md](conventions.md) | TypeScript, Biome, Stylelint/CSS, Modules, testing, accessibility. |
| [discogs.md](discogs.md) | OAuth 1.0a, `discogs-oauth.service`, username validation, cookies, API errors. |
| [database.md](database.md) | Prisma models, crate CRUD, migrations, admin stats. |
| [components.md](components.md) | Component folder layout, naming, tests. |
| [patterns.md](patterns.md) | Context providers, React Query hooks, filters, auth, public crate pages. |
| [platform.md](platform.md) | GitHub CI, `pnpm` scripts, `next.config` (env, CSP, images). |
| [factories.md](factories.md) | Test factories: BaseFactory, Faker, KeysMatch, nullish, nested builds. |
| [source-layout.md](source-layout.md) | Module map under `src/` and related folders. |
| [llms.md](llms.md) | Task-to-chapter routing; copy-paste blurb for agents. |

## Development setup

Machine setup (Node, pnpm, Discogs OAuth app, database, first `pnpm dev`) lives in the root **[README.md](../../README.md)** so we do not duplicate it. After you can run the app locally, use this handbook when you change the codebase.
