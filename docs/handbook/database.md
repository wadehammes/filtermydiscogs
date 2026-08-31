# Database

Prisma schema, crate persistence, and related API routes.

## Stack

- **ORM**: **Prisma 8 RC** (`prisma@8`, `@prisma/orm-postgres`, `@prisma/cli-engine`) — validate on staging/preview only until **`8.0.0` GA**; do not deploy RC builds to production.
- **Database**: PostgreSQL (Vercel Postgres in production)
- **Client**: [`src/lib/db.ts`](../../src/lib/db.ts) — contract runtime (`db`, `orm`, `countRows`, `queryRawRows`, `ormTimestamp`, `ormDate`, `sqlDate`, `sqlTimestamp`, `toOrmDate`, `toOrmJson`) backed by a shared `pg` pool

**Contract** (source of truth): [`src/prisma/contract.prisma`](../../src/prisma/contract.prisma). Emitted artifacts: [`src/prisma/contract.json`](../../src/prisma/contract.json), [`src/prisma/contract.d.ts`](../../src/prisma/contract.d.ts). CLI config: [`prisma.config.ts`](../../prisma.config.ts).

Domain models use **PascalCase** plural names (`Users`, `Crates`, `CrateReleases`, …) with **camelCase** fields in queries (`userId`, `discogsUserId`, `releaseData`). API responses still expose **snake_case** via [`src/lib/db-mappers.ts`](../../src/lib/db-mappers.ts) (crate + layout slices) and [`src/lib/crate-release-mapper.ts`](../../src/lib/crate-release-mapper.ts) (full release/marker rows).

## Prisma 8 workflow

| Step | Command |
|------|---------|
| Emit contract types | `pnpm contract:emit` |
| Re-infer contract from live DB | `pnpm contract:infer` |
| Apply contract to DB | `pnpm db:push` (`prisma db update`) |
| Deploy pending graph migrations | `pnpm db:migrate:deploy` |
| Sign DB after contract changes | `pnpm db:sign` |
| Verify marker + schema | `pnpm db:verify` |
| Plan next migration | `pnpm migration:plan` |

`postinstall` and **`pnpm build`** run **`contract:emit`** only (no **`DATABASE_URL`** required — [`prisma.config.ts`](../../prisma.config.ts) omits `db.connection` when unset). DB sign/verify and other `db:*` scripts load **`.env.local`** via `dotenv-cli`.

Legacy timestamp SQL under [`prisma/migrations/`](../../prisma/migrations/) remains applied on existing databases; new schema changes use the P8 graph migration CLI.

Query pattern (fluent chaining): `orm.Crates.where((crate) => crate.userId.eq(userId)).include("crateReleases", (r) => r.count()).all()`. Pagination: **`.offset(n).limit(m)`** (not `.skip`/`.take`). Counts: `countRows(orm.Users.where(...))`. Transactions: `db.transaction(async (tx) => tx.orm.public.…)`.

The contract uses **string temporal types** — **`TimestampString(3)`**, **`DateString`**, **`TimestamptzString`** in [`contract.prisma`](../../src/prisma/contract.prisma) — so ORM reads/writes ISO strings without a Temporal polyfill. Timestamp filters and writes: **`ormTimestamp(date)`** → `TimestampString<3>`. Date filters and writes: **`ormDate(date)`** → `YYYY-MM-DD`. Raw SQL: **`queryRawRows(db.raw.sql\`…\`.returnsRow({…}).build())`** with **`sqlDate()`** / **`sqlTimestamp()`** for parameter interpolation; **`returnsRow`** codec ids use the current registry (e.g. **`pg/timestamp-string@1`**, **`pg/date-string@1`** — not retired `pg/timestamp@1`). When reading ORM date/timestamp strings into JS date math, use **`toOrmDate()`**. For **jsonb** writes, domain types (e.g. `UserPreferences`, `DiscogsRelease`) are not assignable to ORM **`JsonValue`** — use **`toOrmJson(value)`** at the write boundary instead of casting the whole `create`/`upsert` argument.

See [`prisma-next.md`](../../prisma-next.md) for more examples.

## Models

### `User`

| Field | Notes |
|-------|-------|
| `discogs_user_id` | Primary key — Discogs user ID from **verified OAuth identity** |
| `username` | Discogs username (updated on login) |
| `preferences` | JSON blob for account settings (see below) |
| `login_count` | Completed OAuth logins (incremented in [`recordDiscogsLogin`](../../src/lib/user.server.ts)) |
| `support_toast_dismissed` | When `true`, the support-project action toast is never shown again |
| `support_toast_pending` | One-shot flag set on login when `login_count` reaches the threshold and the toast was not dismissed; consumed by **`GET /api/auth/check`** |
| `last_seen_at` | Last authenticated activity timestamp; set on every login and throttled updates from **`GET /api/auth/check`** ([`touchUserLastSeen`](../../src/lib/user.server.ts), 15-minute interval) |
| `created_at` / `updated_at` | Row timestamps |

One row per Discogs account. **`Crate.user_id`** references **`User.discogs_user_id`** with **`ON DELETE CASCADE`**. Rows are created/updated on OAuth login via [`recordDiscogsLogin`](../../src/lib/user.server.ts) in the auth callback and token-reuse paths.

**`preferences`** (versioned JSON, typed as [`UserPreferencesJson`](../../src/types/userPreferences.types.ts), parsed by [`user-preferences.server.ts`](../../src/lib/user-preferences.server.ts)):

| Field | Default | Purpose |
|-------|---------|---------|
| `persistFilters` | `true` | When `false`, filter/sort selections are not restored on the next visit |
| `autoPlayOnQueueAdd` | `true` | When `true`, the first track added to an empty queue starts playback immediately and opens the video panel |
| `theme` | `"system"` | App color theme (`light`, `dim`, `sepia`, `forest`, `amber`, `slate`, `dark`, `midnight`, `codex`, `discogs`, `wine`, `futuristic`, `high-contrast`, or `system`) |
| `view` | `{ currentView: "card", previousView: "card" }` | Default releases view (`card`, `list`, or `random`) |
| `filters` | Default empty filter state | Saved filter selections when `persistFilters` is `true` (styles, years, formats, sort, style/format/year match mode, search query) |
| `filterViews` | `[]` | Named saved filter snapshots (search, facets, sort) synced across browsers; up to 20 entries |
| `analyticsConsent` | unset | Optional boolean mirror of the analytics cookie choice when set from Settings |

Client reads/writes via **`GET`** / **`PATCH`** [`/api/user/preferences`](../../src/app/api/user/preferences/route.ts). **`GET`** is read-only: it loads the authenticated **`User`** row with **`.first()`** and returns defaults when missing (user rows are created on OAuth login or the first **`PATCH`**). [`useUserPreferencesSync`](../../src/hooks/useUserPreferencesSync.hook.ts) (mounted from [`Providers.tsx`](../../src/components/Providers.tsx)) resets **`theme`** to **`system`** while logged out (guest default). On first login it **seeds local → server only when the server field is still at its default** (e.g. filters saved on preview/staging hydrate into a fresh local browser instead of being overwritten by empty **`localStorage`**); local **`system`** theme is **not** seeded (guest placeholder only). Otherwise it applies server prefs via **`setTheme`**, **`viewStateAtom`**, and **`persistedFiltersAtom`**. Authenticated **`PATCH`** calls go through [`usePersistUserPreferences`](../../src/hooks/usePersistUserPreferences.hook.ts) and [`userPreferencesPersistQueue.ts`](../../src/utils/userPreferencesPersistQueue.ts) (debounced filter writes, merged patches)—from [`ThemeSwitcher`](../../src/components/ThemeSwitcher/ThemeSwitcher.component.tsx), [`useViewDispatch`](../../src/hooks/useViewAtoms.hook.ts), [`useFiltersDispatch`](../../src/hooks/useFilterAtoms.hook.ts), [`SettingsClient`](../../src/components/Settings/SettingsClient.component.tsx), and the sync hook’s first-login seed. **`PATCH`** upserts preferences in one Prisma round trip.

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

### `ProductAnalyticsEvent`

First-party product analytics when the visitor opts in (same consent gate as GTM). No FK to **`User`** — optional **`user_id`** for signed-in events.

| Field | Notes |
|-------|-------|
| `event` / `category` / `action` / `label` | Event metadata (mirrors GTM-style payloads) |
| `value` | Optional string value |
| `page_path` | App route path when recorded |
| `user_id` | Discogs user ID when signed in; nullable for anonymous page views |
| `created_at` | Insert timestamp |

Ingest: **`POST /api/usage/events`** ([`PRODUCT_ANALYTICS_INGEST_PATH`](../../src/types/productAnalytics.types.ts), handler [`src/app/api/usage/events/route.ts`](../../src/app/api/usage/events/route.ts), logic [`product-analytics.server.ts`](../../src/lib/product-analytics.server.ts)). Batches capped at **`PRODUCT_ANALYTICS_MAX_BATCH_SIZE`** (20) in [`productAnalytics.types.ts`](../../src/types/productAnalytics.types.ts); client queue uses the same limit ([`productAnalyticsClient.ts`](../../src/analytics/productAnalyticsClient.ts)). Cleared on **`POST /api/auth/clear-data`** for the authenticated **`user_id`**. Raw rows are kept for **90 days**; older detail is rolled up then deleted (see **`ProductAnalyticsDailyRollup`**).

### `ProductAnalyticsDailyRollup`

Daily aggregates preserved after raw event retention. Composite primary key: **`[date, dimension_type, dimension_key]`** (UTC calendar date).

| Field | Notes |
|-------|-------|
| `date` | UTC calendar date |
| `dimension_type` | `page_path` or `event` |
| `dimension_key` | Path or event name |
| `event_count` | Count for that day/dimension |

Maintained by [`product-analytics-maintenance.server.ts`](../../src/lib/product-analytics-maintenance.server.ts) (daily rollup via ORM **`.upsert()`** per dimension row; raw-event retention via **`.deleteAndCount()`**) via Vercel Cron ([`/api/cron/product-analytics`](../../src/app/api/cron/product-analytics/route.ts)).

## Local database

Vercel exposes **`DATABASE_URL`** per deployment target: **Preview/Development** share the non-prod Postgres (use this for local work against staging); **Production** is separate. There is no fourth “staging” env in Vercel—the **`staging`** git branch deploys to **Preview**.

For local dev against the staging database:

```bash
pnpm db:pull:staging    # writes preview DATABASE_URL to .env.local
pnpm db:verify          # confirm contract matches DB
pnpm dev                # app uses .env.local
```

**`db:pull:dev`** pulls the **Development** target (same **`DATABASE_URL`** as Preview on this project). Use **`db:pull:prod`** / **`db:migrate:prod`** only when intentionally touching production.

**Commit** [`src/prisma/contract.json`](../../src/prisma/contract.json) and [`src/prisma/contract.d.ts`](../../src/prisma/contract.d.ts) (regenerated by **`pnpm contract:emit`**).

**Vercel builds** run **`pnpm contract:emit`** then **`next build`** ([`package.json`](../../package.json)). Run **`pnpm db:migrate:deploy`** against each environment when graph migrations are pending. Preview and Production use **separate** Prisma Postgres instances.

CI runs **`pnpm tsc:ci`** ( **`contract:emit`** + strict **`tsc`**) before tests ([`platform.md`](platform.md)).

## API routes

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/crates` | GET, POST | List/create crates for authenticated user; GET includes `releaseCount` and up to three `previewThumbs` (ordered by `sort_order`) per crate |
| `/api/crates/[id]` | GET, PATCH, DELETE | Single crate CRUD; can toggle `private`, update `username`; GET returns releases ordered by **`sort_order`** plus **`markers[]`** |
| `/api/crates/[id]/layout` | PUT | Atomically replace crate layout (release order + set markers) |
| `/api/crates/[id]/releases` | GET, POST, PATCH | List/add releases; bulk clear packed (`clear_found`); new releases prepend at min **`sort_order` − 1000** |
| `/api/crates/[id]/releases/[releaseId]` | PATCH, DELETE | Mark packed / remove release from crate |
| `/api/crates/public/[id]` | GET | Public crate payload (no auth required when not private); releases ordered by **`sort_order`** only (no markers) |
| `/api/crates/sync` | POST | Sync local crate state with server; blocks bulk deletes above 50% unless **`force=true`** (structured **`crate_sync_force_override`** log + audit metadata) |
| `/api/crates/health` | GET | Admin-only DB diagnostics (connection, **`databaseHost`**, crate + **`product_analytics_events`** table checks, pool/query stats) |
| `/api/dashboard/most-crated` | GET | Aggregated stats |
| `/api/admin/stats` | GET | Admin-only aggregates (users, crates, releases, crate feature adoption, **engagement**, **account preferences** (filter persistence, analytics consent, themes, default view, saved filter views), and **feature usage** from **`product_analytics_daily_rollups`** + recent raw events) |
| `/api/admin/users/[username]` | GET | Admin-only lookup for a Discogs username: account metadata, preferences summary, crate totals, activity, analytics counts, and recent crates |
| `/api/usage/events` | POST | Ingest consent-gated product analytics events (IP rate-limited; optional **`user_id`** when signed in) |
| `/api/cron/product-analytics` | GET | Daily rollup + 90-day raw retention (Vercel Cron; **`Authorization: Bearer CRON_SECRET`**) |
| `/api/auth/clear-data` | POST | Delete authenticated user's **`User`** row (cascades crates), delete **`product_analytics_events`** rows for that **`user_id`**, and clear session cookies |
| `/api/user/preferences` | GET, PATCH | Read/update authenticated user's preferences JSON |

All mutating crate routes require a verified OAuth session via **`getVerifiedUserFromRequestWithRateLimit`** ([`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)) and scope queries by **`identity.id`** from Discogs—never by the **`discogs_user_id`** cookie alone.

**Request validation:** Zod schemas live under [`src/lib/validation/`](../../src/lib/validation/). API routes use [`parseRequestBody`](../../src/lib/validation/parseRequestBody.ts) where applicable. Schemas cover crate CRUD/layout/sync, user preferences, analytics ingest, collection note/rating writes, crate release snapshots, admin user lookup (form + route username check), and form inputs. **React Hook Form** + **`@hookform/resolvers/zod`** back crate create/rename, release-notes editors/scratchpads, crate set notes, collection search, crate layout marker labels, and admin user lookup. Prefer extending those schemas (and route/form specs) over ad-hoc validation—keep forgiving parsers for stored/read paths (e.g. **`parseUserPreferences`**, localStorage filters).

Authenticated crate handlers return **`privateRouteJson`** / **`createErrorResponse`** ([`src/lib/private-route-response.ts`](../../src/lib/private-route-response.ts), [`src/lib/api-helpers.ts`](../../src/lib/api-helpers.ts)). With **`cacheComponents`**, do **not** add **`export const dynamic = "force-dynamic"`** — cookie/session access keeps handlers dynamic automatically. See [platform.md](platform.md) (**Private session API responses**).

**`/api/crates/health`** is admin-only ([`verifyAdminFromRequest`](../../src/lib/admin-helpers.ts), same OAuth verification as **`/api/admin/stats`**). Returns JSON diagnostics: Prisma connectivity, sanitized **`databaseHost`** (from **`DATABASE_URL`**), **`crateTableAccessible`** / **`crateCount`**, **`analyticsEventsTableAccessible`** / **`analyticsEventCount`** (confirms the analytics ingest migration is applied on the DB this deployment uses), optional pool/query/audit stats when **`DB_ENABLE_DIAGNOSTICS=true`**. Use after deploy or migration issues — Production and Preview use separate Postgres instances.

## Public community stats

Aggregate crate totals for the public footer (crates, public crates, saved releases, distinct collectors) are loaded server-side via [`src/lib/public-stats.server.ts`](../../src/lib/public-stats.server.ts), cached for five minutes with `unstable_cache`. No auth required; if the database is unavailable the stats block is omitted.

## Public crates

When **`private: false`**, [`src/lib/public-crate.server.ts`](../../src/lib/public-crate.server.ts) and [`src/lib/public-crate-query.server.ts`](../../src/lib/public-crate-query.server.ts) load crate metadata and releases for SSR/SEO on **`/crate/[id]`**. Public routes validate crate IDs with [`isValidCrateId`](../../src/lib/crate-id.ts) (UUID) before querying; [`findPublicCrateById`](../../src/lib/public-crate-query.server.ts) resolves **`private: false`** rows by **`id`** (logs **`public_crate_ambiguous_id`** if more than one match). **`getPublicCrateMetadataForPage`** returns **`null`** on Postgres errors so **`generateMetadata`** and build prerender fall back instead of failing the deploy. **`getPublicCrateIdsForStaticGeneration()`** (cached, default **`PUBLIC_CRATE_STATIC_PARAMS_LIMIT`** = 100 recent public crates) feeds public crate URLs in [`sitemap.ts`](../../src/app/sitemap.ts). **`generateStaticParams`** on [`/crate/[id]/page.tsx`](../../src/app/crate/[id]/page.tsx) passes **`PUBLIC_CRATE_BUILD_PRERENDER_LIMIT`** (25) so production builds do not open too many Postgres connections while pre-rendering metadata. Remaining public crate URLs still render on demand. Returns **`[]`** when **`DATABASE_URL`** is missing (local builds without a DB). During **`next build`**, [`db.ts`](../../src/lib/db.ts) caps the pg pool at **1** connection per worker when **`NEXT_PHASE=phase-production-build`**. Public API responses strip private collection fields (`notes`, `rating`, `date_added`) via [`toPublicReleaseSnapshot`](../../src/lib/release-data-validation.ts) before returning `release_data`. OG images: [`src/app/api/og/crate/[id]/route.tsx`](../../src/app/api/og/crate/[id]/route.tsx).

If **`username`** is missing on an older public crate, the public API may backfill from the viewer's cookie when they own the crate.

## Client integration

- **`CrateProvider`** + **`useCrateMutations`** ([`src/hooks/mutations/useCrateMutations.ts`](../../src/hooks/mutations/useCrateMutations.ts)) call the crate API via **`api.*`** in [`src/api/urls.ts`](../../src/api/urls.ts).
- **`useCrateMigration`** handles legacy localStorage → server migration on login.

## Auditing

[`src/lib/db-audit.ts`](../../src/lib/db-audit.ts) supports audit logging where enabled; see usage in crate route handlers.

## Local database URL

Set **`DATABASE_URL`** in **`.env.local`** (from Vercel dashboard or local Postgres). Never commit credentials. Root [README.md](../../README.md) covers Vercel setup.
