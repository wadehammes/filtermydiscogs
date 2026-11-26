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
pnpm db:diff:migrations # migrations folder vs schema (needs shadow DB; see below)
```

**Migrate / CLI database URL precedence:** **`DIRECT_URL`**, then **`POSTGRES_URL`**, then **`DATABASE_URL`** — shared by [`prisma.config.ts`](../../prisma.config.ts), [`scripts/migrate-deploy.sh`](../../scripts/migrate-deploy.sh) via [`scripts/resolve-migrate-database-url.ts`](../../scripts/resolve-migrate-database-url.ts) → [`readMainDatabaseUrlFromEnv`](../../src/lib/databaseUrlEnv.ts) (`MIGRATE_DATABASE_URL_ENV_KEYS`), and **Prisma during `next build`** (see [`readRuntimeDatabaseUrlFromEnv`](../../src/lib/databaseUrlEnv.ts) when **`NEXT_PHASE=phase-production-build`**). **Deployed request handlers** use pooled resolution via [`db.ts`](../../src/lib/db.ts) — serverless concurrency must not hit the direct integration string; Prisma Console **`DATABASE_URL_POOLED`** (`pooled.db.prisma.io`) is the preferred explicit pooled var ([Prisma Vercel guide](https://www.prisma.io/docs/guides/postgres/vercel)).

**Shadow database (`SHADOW_DATABASE_URL`):** Used by **`prisma migrate dev`** and **`pnpm db:diff:migrations`** to apply migrations into a disposable database for drift checks. Set **`SHADOW_DATABASE_URL`** in **`.env.local`** when **`DATABASE_URL`** is remote (e.g. Prisma Postgres / staging pull). For **localhost** URLs, [`prisma.config.ts`](../../prisma.config.ts) auto-derives **`{database}_shadow`** when **`SHADOW_DATABASE_URL`** is unset — create that empty database locally first. Never point shadow at production or shared staging data.

Vercel exposes **`DATABASE_URL`** per deployment target: **Preview/Development** share the non-prod Postgres (use this for local work against staging); **Production** is separate. There is no fourth “staging” env in Vercel—the **`staging`** git branch deploys to **Preview**.

For local dev against the staging database:

```bash
pnpm db:pull:staging    # writes preview DATABASE_URL to .env.local
pnpm db:migrate:staging # apply migrations (e.g. found_at) to that DB
pnpm dev                # app uses .env.local
```

**`db:pull:dev`** pulls the **Development** target (same **`DATABASE_URL`** as Preview on this project). Use **`db:pull:prod`** / **`db:migrate:prod`** only when intentionally touching production.

Generated Prisma client output is **not committed** (`/prisma/node_modules` and root `node_modules/.prisma/client` are gitignored; CI and `postinstall` run `prisma generate`).

**Vercel builds** run **`scripts/migrate-deploy.sh`** before **`next build`** ([`package.json`](../../package.json)) so each Production / Preview deployment applies pending migrations. The script resolves the migrate URL through **`readMainDatabaseUrlFromEnv`** (Prisma Postgres: direct host **`db.prisma.io`** for migrations; pooled **`pooled.db.prisma.io`** for runtime when configured), appends **`connect_timeout=30`** for serverless cold starts, and **retries** transient **`P1001`** connection errors (default 5 attempts, exponential backoff). Override with **`PRISMA_MIGRATE_DEPLOY_ATTEMPTS`** / **`PRISMA_MIGRATE_DEPLOY_RETRY_DELAY_SEC`**. Skips migrate when no database URL is set (local builds without **`.env.local`**). For one-off fixes, still use **`pnpm db:pull:prod`** + **`pnpm db:migrate:prod`** locally. Preview and Production use **separate** Prisma Postgres instances — migrating one does not migrate the other.

Migrations live under [`prisma/migrations/`](../../prisma/migrations/).

CI runs **`pnpm prisma generate`** before typecheck/tests ([`platform.md`](platform.md)).
