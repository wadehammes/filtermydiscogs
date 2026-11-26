## Prisma Postgres environment contract

Each **Vercel target** (Production, Preview, Development) has its **own** Prisma Postgres instance. Use the integration **`POSTGRES_URL`** username prefix to confirm you are on the right database.

| Variable | Host | Used for |
| -------- | ---- | -------- |
| **`POSTGRES_URL`** | **`db.prisma.io`** (direct) | Migrate, Prisma CLI, **`next build`** DB access |
| **`DATABASE_URL`** | **`db.prisma.io`** (direct, same creds as **`POSTGRES_URL`**) | Tooling parity; runtime fallback when pooled var missing |
| **`DATABASE_URL_POOLED`** | **`pooled.db.prisma.io`** (same creds) | **Deployed** request-time traffic (preferred) |

Runtime resolution lives in [`readRuntimeDatabaseUrlFromEnv`](../../src/lib/databaseUrlEnv.ts): valid **`DATABASE_URL_POOLED`** first; otherwise rewrite direct **`DATABASE_URL`** to the pooler. **`next build`** uses migrate precedence (direct) instead. Do not point serverless traffic at the direct integration string — see [platform.md → Environment variables](platform.md#environment-variables).

**Local:** **`pnpm db:pull:staging`** or **`db:pull:dev`** writes Vercel env to **`.env.local`** (no post-pull rewrite). **`next dev`** can run with integration **`DATABASE_URL`** (direct) only; omit **`DATABASE_URL_POOLED`** locally if you accept in-app rewrite. Avoid **`db:pull:prod`** for day-to-day work.

**Env repair (drift / incidents only):** **`pnpm db:apply-vercel-database-env`** **`production|preview|development`** ([`scripts/apply-vercel-database-env-from-postgres.sh`](../../scripts/apply-vercel-database-env-from-postgres.sh)) sets **`DATABASE_URL`** + **`DATABASE_URL_POOLED`** from each target’s **`POSTGRES_URL`**. **`pnpm db:sync-pooled-url`** does the same for **`.env.local`** ([`scripts/sync-pooled-database-url-from-postgres.ts`](../../scripts/sync-pooled-database-url-from-postgres.ts)). Normal workflow does **not** require these commands.

