# Database

Prisma schema, crate persistence, and related API routes.

## Stack

- **ORM**: Prisma 7 with **`prisma-client-js`**
- **Database**: PostgreSQL (Vercel Postgres in production)
- **Client**: [`src/lib/db.ts`](../../src/lib/db.ts) — singleton Prisma client for route handlers

Schema: [`prisma/schema.prisma`](../../prisma/schema.prisma).

## Models

### `Crate`

| Field | Notes |
|-------|-------|
| `user_id` | Discogs user ID (from `discogs_user_id` cookie) |
| `id` | UUID string |
| `name` | Display name |
| `username` | Discogs username (for public crate attribution) |
| `is_default` | One default crate per user |
| `private` | When `false`, crate is publicly viewable at `/crate/[id]` |

Composite primary key: **`[user_id, id]`**.

### `CrateRelease`

Stores a release snapshot as **`release_data` JSON** keyed by Discogs **`instance_id`**.

Composite primary key: **`[user_id, crate_id, instance_id]`**. Cascades on crate delete.

## Migrations

```bash
pnpm db:migrate      # dev: create/apply migrations (.env.local)
pnpm db:migrate:prod # production deploy
pnpm db:push         # prototype schema push (script loads env)
pnpm db:studio       # Prisma Studio
pnpm db:generate     # regenerate client (also runs on build/postinstall)
```

Migrations live under [`prisma/migrations/`](../../prisma/migrations/).

CI runs **`pnpm prisma generate`** before typecheck/tests ([`platform.md`](platform.md)).

## API routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/crates` | GET, POST | List/create crates for authenticated user |
| `/api/crates/[id]` | GET, PATCH, DELETE | Single crate CRUD; can toggle `private`, update `username` |
| `/api/crates/[id]/releases` | GET, POST | List/add releases in crate |
| `/api/crates/[id]/releases/[releaseId]` | DELETE | Remove release from crate |
| `/api/crates/public/[id]` | GET | Public crate payload (no auth required when not private) |
| `/api/crates/sync` | POST | Sync local crate state with server |
| `/api/crates/health` | GET | Health check |
| `/api/dashboard/most-crated` | GET | Aggregated stats |
| `/api/admin/stats` | GET | Admin-only aggregates |

All mutating crate routes require a verified OAuth session via **`getVerifiedUserFromRequestWithRateLimit`** ([`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)) and scope queries by **`identity.id`** from Discogs—never by the **`discogs_user_id`** cookie alone.

**`/api/crates/health`** is admin-only (same OAuth verification as **`/api/admin/stats`**).

## Public crates

When **`private: false`**, [`src/lib/public-crate.server.ts`](../../src/lib/public-crate.server.ts) loads crate metadata and releases for SSR/SEO on **`/crate/[id]`**. OG images: [`src/app/api/og/crate/[id]/route.tsx`](../../src/app/api/og/crate/[id]/route.tsx).

If **`username`** is missing on an older public crate, the public API may backfill from the viewer's cookie when they own the crate.

## Client integration

- **`CrateProvider`** + **`useCrateMutations`** ([`src/hooks/queries/useCrateMutations.ts`](../../src/hooks/queries/useCrateMutations.ts)) call the crate API via [`src/api/helpers.ts`](../../src/api/helpers.ts).
- **`useCrateMigration`** handles legacy localStorage → server migration on login.

## Auditing

[`src/lib/db-audit.ts`](../../src/lib/db-audit.ts) supports audit logging where enabled; see usage in crate route handlers.

## Local database URL

Set **`DATABASE_URL`** in **`.env.local`** (from Vercel dashboard or local Postgres). Never commit credentials. Root [README.md](../../README.md) covers Vercel setup.
