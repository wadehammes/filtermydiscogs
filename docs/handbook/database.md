# Database

Prisma schema, crate persistence, and related API routes.

## Stack

- **ORM**: Prisma 7 with **`prisma-client-js`**
- **Database**: PostgreSQL (Vercel Postgres in production)
- **Client**: [`src/lib/db.ts`](../../src/lib/db.ts) — singleton Prisma client for route handlers. Normalizes **`sslmode=require`** / **`prefer`** / **`verify-ca`** to **`verify-full`** (current `node-pg` semantics; silences the upcoming pg v9 alias warning) and enforces **`verify-full`** in production when SSL mode is omitted.

Schema: [`prisma/schema.prisma`](../../prisma/schema.prisma). Datasource URL: [`prisma.config.ts`](../../prisma.config.ts) (Prisma 7).

## Models

### `User`

| Field | Notes |
|-------|-------|
| `discogs_user_id` | Primary key — Discogs user ID from **verified OAuth identity** |
| `username` | Discogs username (updated on login) |
| `preferences` | JSON blob for account settings (see below) |
| `created_at` / `updated_at` | Row timestamps |

One row per Discogs account. **`Crate.user_id`** references **`User.discogs_user_id`** with **`ON DELETE CASCADE`**. Rows are upserted on OAuth login via [`upsertDiscogsUser`](../../src/lib/user.server.ts) in the auth callback and token-reuse paths.

**`preferences`** (versioned JSON, typed as [`UserPreferencesJson`](../../src/types/userPreferences.types.ts), parsed by [`user-preferences.server.ts`](../../src/lib/user-preferences.server.ts); Prisma field typing via [`prisma-json-types-generator`](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-json-fields) + [`src/types/prisma-json.d.ts`](../../src/types/prisma-json.d.ts)):

| Field | Default | Purpose |
|-------|---------|---------|
| `persistFilters` | `true` | When `false`, filter/sort selections are not restored on the next visit |
| `theme` | `"light"` | App color theme (`light`, `dim`, `sepia`, `slate`, `dark`, `midnight`, `futuristic`, `high-contrast`, or `system`) |
| `view` | `{ currentView: "card", previousView: "card" }` | Default releases view (`card`, `list`, or `random`) |
| `filters` | Default empty filter state | Saved filter selections when `persistFilters` is `true` (styles, years, formats, sort, style operator, search query) |

Client reads/writes via **`GET`** / **`PATCH`** [`/api/user/preferences`](../../src/app/api/user/preferences/route.ts). **`GET`** is read-only: it **`findUnique`**s the authenticated **`User`** row and returns defaults when missing (user rows are created on OAuth login or the first **`PATCH`**). [`useUserPreferencesSync`](../../src/hooks/useUserPreferencesSync.hook.ts) (mounted from [`Providers.tsx`](../../src/components/Providers.tsx)) resets **`theme`** to **`system`** while logged out (guest default). On first login it **seeds local → server only when the server field is still at its default** (e.g. filters saved on preview/staging hydrate into a fresh local browser instead of being overwritten by empty **`localStorage`**); local **`system`** theme is **not** seeded (guest placeholder only). Otherwise it applies server prefs via **`setTheme`**, **`viewStateAtom`**, and **`persistedFiltersAtom`**. Authenticated **`PATCH`** calls go through [`usePersistUserPreferences`](../../src/hooks/usePersistUserPreferences.hook.ts) and [`userPreferencesPersistQueue.ts`](../../src/utils/userPreferencesPersistQueue.ts) (debounced filter writes, merged patches)—from [`ThemeSwitcher`](../../src/components/ThemeSwitcher/ThemeSwitcher.component.tsx), [`useViewDispatch`](../../src/hooks/useViewAtoms.hook.ts), [`useFiltersDispatch`](../../src/hooks/useFilterAtoms.hook.ts), [`SettingsClient`](../../src/components/Settings/SettingsClient.component.tsx), and the sync hook’s first-login seed. **`PATCH`** upserts preferences in one Prisma round trip.

### `Crate`

| Field | Notes |
|-------|-------|
| `user_id` | Discogs user ID from **verified OAuth identity** (matches Prisma `Int`; not the cookie alone) |
| `id` | UUID string |
| `name` | Display name |
| `username` | Discogs username (for public crate attribution) |
| `is_default` | One default crate per user |
| `private` | When `false`, crate is publicly viewable at `/crate/[id]` |
| `packed_enabled` | When `true`, owner sees gig-packing checklist UI on the crate detail page ([`/crates/[id]`](../../src/app/crates/[id]/page.tsx); default **`false`**) |
| `notes` | Optional free-text notes for the crate; editable in **Edit crate** and the owner detail page set-notes scratchpad (not exposed on public crate routes) |

Composite primary key: **`[user_id, id]`**.

### `CrateRelease`

Stores a release snapshot as **`release_data` JSON** keyed by Discogs **`instance_id`**. Optional **`found_at`** timestamp marks albums **packed for a gig** (owner-only; not exposed on public crate routes). **`sort_order`** controls display order within a crate (ascending; spaced by 1000; backfilled from **`added_at DESC`** on migration).

Composite primary key: **`[user_id, crate_id, instance_id]`**. Cascades on crate delete.

### `CrateSetMarker`

Owner-only section labels within a crate layout (e.g. “Peak hour”). Composite primary key: **`[user_id, crate_id, id]`** (UUID). **`sort_order`** interleaves with releases in the unified layout. Not returned on public crate routes.

## Migrations

```bash
pnpm db:migrate        # dev: create/apply migrations (.env.local)
pnpm db:pull:staging   # pull staging/preview DATABASE_URL into .env.local (Vercel CLI)
pnpm db:migrate:staging # apply pending migrations to staging (.env.local)
pnpm db:pull:prod      # pull production DATABASE_URL into .env.local
pnpm db:migrate:prod   # apply pending migrations to production (.env.local)
pnpm db:push           # prototype schema push (script loads env)
pnpm db:studio         # Prisma Studio
pnpm db:generate       # regenerate client (also runs on build/postinstall)
```

Vercel exposes **`DATABASE_URL`** per deployment target: **Preview/Development** share the non-prod Postgres (use this for local work against staging); **Production** is separate. There is no fourth “staging” env in Vercel—the **`staging`** git branch deploys to **Preview**.

For local dev against the staging database:

```bash
pnpm db:pull:staging    # writes preview DATABASE_URL to .env.local
pnpm db:migrate:staging # apply migrations (e.g. found_at) to that DB
pnpm dev                # app uses .env.local
```

**`db:pull:dev`** pulls the **Development** target (same **`DATABASE_URL`** as Preview on this project). Use **`db:pull:prod`** / **`db:migrate:prod`** only when intentionally touching production.

Generated Prisma client output is **not committed** (`/prisma/node_modules` and root `node_modules/.prisma/client` are gitignored; CI and `postinstall` run `prisma generate`).

Migrations live under [`prisma/migrations/`](../../prisma/migrations/).

CI runs **`pnpm prisma generate`** before typecheck/tests ([`platform.md`](platform.md)).

## API routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/crates` | GET, POST | List/create crates for authenticated user; GET includes `releaseCount` and up to three `previewThumbs` (ordered by `sort_order`) per crate |
| `/api/crates/[id]` | GET, PATCH, DELETE | Single crate CRUD; can toggle `private`, update `username`; GET returns releases ordered by **`sort_order`** plus **`markers[]`** |
| `/api/crates/[id]/layout` | PUT | Atomically replace crate layout (release order + set markers) |
| `/api/crates/[id]/releases` | GET, POST, PATCH | List/add releases; bulk clear packed (`clear_found`); new releases append at max **`sort_order` + 1000** |
| `/api/crates/[id]/releases/[releaseId]` | PATCH, DELETE | Mark packed / remove release from crate |
| `/api/crates/public/[id]` | GET | Public crate payload (no auth required when not private); releases ordered by **`sort_order`** only (no markers) |
| `/api/crates/sync` | POST | Sync local crate state with server |
| `/api/crates/health` | GET | Health check |
| `/api/dashboard/most-crated` | GET | Aggregated stats |
| `/api/admin/stats` | GET | Admin-only aggregates (users, crates, releases, plus crate feature adoption: public crates, gig packing, notes, set markers, packed releases) |
| `/api/auth/clear-data` | POST | Delete authenticated user's **`User`** row (cascades crates) and clear session cookies |

All mutating crate routes require a verified OAuth session via **`getVerifiedUserFromRequestWithRateLimit`** ([`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)) and scope queries by **`identity.id`** from Discogs—never by the **`discogs_user_id`** cookie alone.

Authenticated crate handlers return **`privateRouteJson`** / **`createErrorResponse`** ([`src/lib/private-route-response.ts`](../../src/lib/private-route-response.ts), [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)). With **`cacheComponents`**, do **not** add **`export const dynamic = "force-dynamic"`** — cookie/session access keeps handlers dynamic automatically. See [platform.md](platform.md) (**Private session API responses**).

**`/api/crates/health`** is admin-only (same OAuth verification as **`/api/admin/stats`**).

## Public community stats

Aggregate crate totals for the public footer (crates, public crates, saved releases, distinct collectors) are loaded server-side via [`src/lib/public-stats.server.ts`](../../src/lib/public-stats.server.ts), cached for five minutes with `unstable_cache`. No auth required; if the database is unavailable the stats block is omitted.

## Public crates

When **`private: false`**, [`src/lib/public-crate.server.ts`](../../src/lib/public-crate.server.ts) loads crate metadata and releases for SSR/SEO on **`/crate/[id]`**. **`getPublicCrateIdsForStaticGeneration()`** (cached, up to **`PUBLIC_CRATE_STATIC_PARAMS_LIMIT`** = 100 recent public crates) feeds **`generateStaticParams`** on [`/crate/[id]/page.tsx`](../../src/app/crate/[id]/page.tsx) and public crate URLs in [`sitemap.ts`](../../src/app/sitemap.ts). Returns **`[]`** when **`DATABASE_URL`** is missing (local builds without a DB). Public API responses strip private collection fields (`notes`, `rating`, `date_added`) via [`toPublicReleaseSnapshot`](../../src/lib/release-data-validation.ts) before returning `release_data`. OG images: [`src/app/api/og/crate/[id]/route.tsx`](../../src/app/api/og/crate/[id]/route.tsx).

If **`username`** is missing on an older public crate, the public API may backfill from the viewer's cookie when they own the crate.

## Client integration

- **`CrateProvider`** + **`useCrateMutations`** ([`src/hooks/queries/useCrateMutations.ts`](../../src/hooks/queries/useCrateMutations.ts)) call the crate API via [`src/api/helpers.ts`](../../src/api/helpers.ts).
- **`useCrateMigration`** handles legacy localStorage → server migration on login.

## Auditing

[`src/lib/db-audit.ts`](../../src/lib/db-audit.ts) supports audit logging where enabled; see usage in crate route handlers.

## Local database URL

Set **`DATABASE_URL`** in **`.env.local`** (from Vercel dashboard or local Postgres). Never commit credentials. Root [README.md](../../README.md) covers Vercel setup.
