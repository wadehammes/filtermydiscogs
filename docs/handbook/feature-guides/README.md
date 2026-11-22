# Feature guides (decisions + examples)

These guides explain **what each product area does**, **how the code is wired**, and **why we chose one approach over another**—in plain language, with small code excerpts.

They complement—not replace—the reference chapters:

| If you need… | Read |
| ------------ | ---- |
| Quick “use X not Y” tables | [decisions.md](../decisions.md) |
| Route maps, provider order, long tables | [patterns.md](../patterns.md) |
| Prisma fields and API route inventory | [database.md](../database.md) |
| File naming and tests | [conventions.md](../conventions.md) |

## Guides

| Guide | Audience question |
| ----- | ----------------- |
| [Client state](client-state.md) | Why Jotai for filters but React Query for crates? |
| [Collection browsing](collection-browsing.md) | How does the full Discogs collection get to the grid without refetching every page? |
| [Public sharing](public-sharing.md) | Why don’t we hydrate every release on the server for `/playlist/[id]`? |
| [Playback](playback.md) | Where does the YouTube queue live, and why two playback shells? |
| [Collection radio](radio.md) | Filtered shuffled radio — playlist-parity start, no provider embed surgery (v1 design) |
| [Crates & playlists (Postgres)](crates-and-playlists.md) | What is an `instance_id`, and where do cover snapshots live? |
| [API layer & Discogs](api-and-discogs.md) | Why `api.*`, throttling, and batch release fetch? |

## How each guide is structured

1. **User-visible behavior** — what people see on the site.
2. **Moving parts** — modules and data flow (with links into `src/`).
3. **Decisions & rationale** — tradeoffs we accepted on purpose.
4. **Code snapshots** — minimal examples copied from production patterns.

When you change behavior in one of these areas, update the matching guide **and** the reference chapter listed in [llms.md](../llms.md).