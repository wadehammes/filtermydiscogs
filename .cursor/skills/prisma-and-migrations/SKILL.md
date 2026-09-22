---
name: prisma-and-migrations
description: >-
  Prisma schema changes, migrate, db:generate, crate models. Use when editing
  prisma/ or crate API behavior.
---

# Prisma and migrations

Handbook: [database.md](../../docs/handbook/database.md).

## After `schema.prisma` changes

```bash
pnpm db:generate    # always — client must match schema
pnpm db:migrate     # local dev migration
```

Session stop hook nudges **`db:generate`** when schema changed. CI/build run generate via **`postinstall`** / **`predev`**.

## Commands

| Task | Command |
|------|---------|
| Local migrate | `pnpm db:migrate` |
| Prototype push | `pnpm db:push` (sparingly) |
| Staging DB env | `pnpm db:pull:staging` then `pnpm db:migrate:staging` |
| Studio | `pnpm db:studio` |

Generated client is **not committed** — run generate after pull.

## API work

- Crate routes: scope by **verified OAuth user id** — see skill **`api-routes`**.
- Schema reference: [database.md → Models](../../docs/handbook/database.md#models), [API routes table](../../docs/handbook/database.md#api-routes).

## Deploy

Vercel runs migrate deploy before build ([platform.md / database.md migrations section](../../docs/handbook/database.md#migrations)). Preview and Production are **separate** Postgres instances.
