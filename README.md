<img width="2042" height="1194" alt="app-preview--dark" src="https://github.com/user-attachments/assets/d1206324-c2be-4650-8598-f4b98aff7b41" />

# FilterMyDisco.gs

A web application to filter and explore your Discogs collection, including vinyl, CDs, tapes, and every other format Discogs supports.

## Features

- **Discogs OAuth** — Secure login with your Discogs account
- **Full collection browse** — Paginated sync across every format Discogs supports, with local cache for faster return visits
- **Search & filters** — Search by title, artist, label, or notes; filter by genre/style, year, and format (with ANY / ALL / NONE match modes); save named filter views
- **Sorting & views** — Sort by label, artist, title, date added, year, rating, and more; card, list (table on desktop), or random view
- **Release details** — In-app modal with tracklist, similar releases, personal rating, and Discogs-synced collection notes
- **In-app playback** — Preview tracks from a persistent mini player and queue while you browse
- **Crates** — Multiple crates for gigs or themed lists; reorder releases, section markers, set notes, and optional gig-packing progress; share a crate publicly
- **Collection insights** — Dashboard with milestones, style evolution, and growth charts
- **Mosaic generator** — Build and download cover-art grids from your collection or a crate
- **Settings** — Theme (light / dark / system), collection sync, filter persistence, and clear stored data
- **Responsive UI** — Desktop sidebar crates, mobile drawers, and touch-friendly filters

## Setup

### Prerequisites

- Node.js 24+ and pnpm (via [mise](https://mise.jdx.dev/) recommended — versions in [`.tool-versions`](./.tool-versions))
- A Discogs account
- Discogs API credentials
- A Postgres database (Vercel / Prisma Postgres for deployed envs)

With mise:

```bash
mise trust          # once per clone, if prompted
mise bootstrap      # tools + pnpm install + Prisma generate
mise run ci         # same quality gates as GitHub Actions
```

### Discogs OAuth Setup

1. Go to [Discogs Settings > Developers](https://www.discogs.com/settings/developers)
2. Create a new application
3. Set the callback URL to `http://localhost:6767/api/auth/callback` for development
4. Copy your Consumer Key and Consumer Secret

### Environment Variables

Create a `.env.local` file in the root directory (mise loads it automatically in this repo):

```bash
# Discogs OAuth Credentials
DISCOGS_CONSUMER_KEY=your_consumer_key_here
DISCOGS_CONSUMER_SECRET=your_consumer_secret_here

# OAuth Callback URL (optional, defaults to http://localhost:6767/api/auth/callback)
DISCOGS_CALLBACK_URL=http://localhost:6767/api/auth/callback

# Site URL (optional, defaults to https://www.filtermydisco.gs)
NEXT_PUBLIC_SITE_URL=http://localhost:6767

# Database (Prisma)
# From Vercel: Project → Storage / Prisma Postgres → copy env into .env.local
# Runtime prefers pooled DATABASE_URL; migrations use DIRECT_URL or POSTGRES_URL when set
DATABASE_URL=your_database_url_here
# DIRECT_URL=your_direct_database_url_here
# POSTGRES_URL=your_postgres_url_here

# Admin User ID (optional, for /admin)
# Discogs user ID — available after login (discogs_user_id cookie)
ADMIN_USER_ID=your_discogs_user_id_here
CRON_SECRET=generate_a_long_random_secret_for_vercel_cron

# Stripe (optional, About page donations)
STRIPE_API_KEY=sk_test_your_stripe_secret_key_here
```

Full variable list: [`docs/handbook/platform.md`](./docs/handbook/platform.md).

### Database Setup

1. Provision Postgres for the Vercel project (Prisma Postgres / Marketplace storage) and copy connection env vars into `.env.local`.
2. Install and apply schema:

```bash
pnpm install          # or: mise bootstrap
pnpm db:generate
pnpm db:migrate       # local migrate; or pnpm db:push for prototype
```

Helpers: `pnpm db:pull:dev` / `db:pull:staging` / `db:pull:prod` pull env from Vercel; `pnpm db:studio` opens Prisma Studio.

### Installation

```bash
mise bootstrap   # recommended
# or: pnpm install && pnpm db:generate

pnpm dev
```

The app will be available at `http://localhost:6767`.

## Usage

1. Click **Connect with Discogs** on the home page and authorize the app
2. Browse **Releases** — search, filter, sort, open release details, edit notes/ratings, and preview tracks
3. Stage picks in the crate drawer, then manage full crates under **Crates** (reorder, sections, packing, public share)
4. Check **Dashboard** for collection insights; **Mosaic** for cover-art grids
5. Adjust theme and sync options in **Settings**; sign out from the user menu

## Pages

| Path | Purpose |
|------|---------|
| `/` | Public landing / login |
| `/releases` | Browse, filter, sort collection; crate drawer |
| `/crates` | Crate hub (your crates) |
| `/crates/[id]` | Owner crate workspace |
| `/crate/[id]` | Public shared crate (no login) |
| `/dashboard` | Collection analytics |
| `/mosaic` | Cover-art mosaic generator |
| `/settings` | Theme, sync, data preferences |
| `/about` | About, support, clear data |
| `/legal` | Terms of Service and Privacy Policy |
| `/admin` | Admin stats (requires `ADMIN_USER_ID`) |

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **UI**: CSS Modules, Base UI (dialogs, menus, selects, toasts), TanStack Table / Charts / Virtual
- **State**: Jotai (filters, view) + React Context (auth, collection meta, crates, theme, playback)
- **Data**: TanStack Query, Prisma 7 + PostgreSQL, Discogs OAuth 1.0a API
- **Forms**: React Hook Form + Zod
- **Tooling**: pnpm, mise, Biome, Stylelint, Jest + Testing Library, Playwright, Knip
- **Analytics**: Google Tag Manager (consent-aware)

## Development

```bash
pnpm dev              # http://localhost:6767 (Turbopack)
pnpm dev:webpack      # fallback if Turbopack hits lazy-chunk issues

mise run ci           # tsc + lint + CSS lint + tests + knip (matches Actions)
pnpm test             # Jest
pnpm test:file        # Jest watch for one file
pnpm test:e2e         # Playwright (run pnpm test:e2e:install once)

pnpm lint             # Biome check
pnpm lint:fix        # Biome autofix
pnpm lint:css         # Stylelint
pnpm format           # Biome format (check)
pnpm format:fix      # Biome format write
pnpm type-check
pnpm knip

pnpm build && pnpm start
pnpm analyze          # bundle analyzer (webpack build)
pnpm scaffold         # new component scaffold

pnpm db:generate      # Prisma Client
pnpm db:migrate       # migrate dev
pnpm db:push          # push schema (prototype)
pnpm db:studio        # Prisma Studio
```

## Release

```bash
make release tag=v0.0.1
```

## Handbook

The handbook under [`docs/handbook/`](./docs/handbook/) is the canonical place for structure, conventions, Discogs/Prisma patterns, and platform details. Update it when behavior or layout changes so the next reader (human or tool) is not misled.

**Entry point:** [`docs/handbook/README.md`](./docs/handbook/README.md)

**Agents / AI tools:** [CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md). Use the task map in [`docs/handbook/llms.md`](./docs/handbook/llms.md) to route work to the right handbook chapter.

**Suggested reading order**

- **New to the project:** [architecture.md](./docs/handbook/architecture.md), then [conventions.md](./docs/handbook/conventions.md), then skim [patterns.md](./docs/handbook/patterns.md).
- **Discogs OAuth or API:** [discogs.md](./docs/handbook/discogs.md).
- **Crates or database:** [database.md](./docs/handbook/database.md).
- **Test factories / Faker data:** [factories.md](./docs/handbook/factories.md).
- **Adding or changing UI:** [components.md](./docs/handbook/components.md) and [conventions.md](./docs/handbook/conventions.md).
- **Filters, Jotai atoms, contexts, React Query:** [patterns.md](./docs/handbook/patterns.md).
- **CI, mise, Knip, env, security headers:** [platform.md](./docs/handbook/platform.md).
- **Finding a file:** [source-layout.md](./docs/handbook/source-layout.md).

## License

MIT
