# Database

Prisma schema, crate persistence, and related API routes.

## Stack

- **ORM**: Prisma 7 with **`prisma-client-js`**
- **Database**: PostgreSQL (Vercel Postgres in production)
- **Client**: [`src/lib/db.ts`](../../src/lib/db.ts) — singleton Prisma client for route handlers

Schema: [`prisma/schema.prisma`](../../prisma/schema.prisma). Datasource URL: [`prisma.config.ts`](../../prisma.config.ts) (Prisma 7).

## Models

### `Crate`

| Field | Notes |
|-------|-------|
| `user_id` | Discogs user ID from **verified OAuth identity** (matches Prisma `Int`; not the cookie alone) |
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

Generated Prisma client output is **not committed** (`/prisma/node_modules` and root `node_modules/.prisma/client` are gitignored; CI and `postinstall` run `prisma generate`).

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
| `/api/auth/clear-data` | POST | Delete authenticated user's crates and clear session cookies |

All mutating crate routes require a verified OAuth session via **`getVerifiedUserFromRequestWithRateLimit`** ([`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)) and scope queries by **`identity.id`** from Discogs—never by the **`discogs_user_id`** cookie alone.

Authenticated crate handlers return **`privateRouteJson`** / **`createErrorResponse`** ([`src/lib/private-route-response.ts`](../../src/lib/private-route-response.ts), [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)) and set **`export const dynamic = "force-dynamic"`**. See [platform.md](platform.md) (**Private session API responses**).

**`/api/crates/health`** is admin-only (same OAuth verification as **`/api/admin/stats`**).

## Public community stats

Aggregate crate totals for the public footer (crates, public crates, saved releases, distinct collectors) are loaded server-side via [`src/lib/public-stats.server.ts`](../../src/lib/public-stats.server.ts), cached for five minutes with `unstable_cache`. No auth required; if the database is unavailable the stats block is omitted.

## Public crates

When **`private: false`**, [`src/lib/public-crate.server.ts`](../../src/lib/public-crate.server.ts) loads crate metadata and releases for SSR/SEO on **`/crate/[id]`**. Public API responses strip private collection fields (`notes`, `rating`, `date_added`) via [`toPublicReleaseSnapshot`](../../src/lib/release-data-validation.ts) before returning `release_data`. OG images: [`src/app/api/og/crate/[id]/route.tsx`](../../src/app/api/og/crate/[id]/route.tsx).

If **`username`** is missing on an older public crate, the public API may backfill from the viewer's cookie when they own the crate.

## Client integration

- **`CrateProvider`** + **`useCrateMutations`** ([`src/hooks/queries/useCrateMutations.ts`](../../src/hooks/queries/useCrateMutations.ts)) call the crate API via [`src/api/helpers.ts`](../../src/api/helpers.ts).
- **`useCrateMigration`** handles legacy localStorage → server migration on login.

## Auditing

[`src/lib/db-audit.ts`](../../src/lib/db-audit.ts) supports audit logging where enabled; see usage in crate route handlers.

## Local database URL

Set **`DATABASE_URL`** in **`.env.local`** (from Vercel dashboard or local Postgres). Never commit credentials. Root [README.md](../../README.md) covers Vercel setup.
