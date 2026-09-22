---
name: crates-and-membership
description: >-
  Crates API, CrateProvider, drawer, ReleaseCrateMenu, public /crate pages. Use
  for crate CRUD, layout, membership, or sharing.
---

# Crates and membership

Handbook: [patterns.md → Crates](../../docs/handbook/patterns.md#crates), [database.md → API routes](../../docs/handbook/database.md#api-routes).

## Client

- **`CrateProvider`** + **`useCrateMutations`** → **`api.*`**; UI calls **`useCrate()`** / **`useCrateState()`** / **`useCrateActions()`** — not mutation hooks directly (layout saves via **`updateCrateLayout`**).
- Add/remove releases: **[`ReleaseCrateMenu`](../../src/components/ReleaseCard/ReleaseCrateMenu.component.tsx)** (not silent one-click toggles everywhere).
- **Drawer** (`/releases`): [`CrateDrawer`](../../src/components/CrateDrawer/CrateDrawer.component.tsx) — staging; **`useCrateDrawer`**: `isDrawerOpen = userToggled ?? isDesktop`; login → **`resetDrawer()`**.
- **Owner:** `/crates`, `/crates/[id]` — layout markers, DnD **`CrateLayoutList`**, **`PUT …/layout`**.

## Server

- Verified OAuth user id scope — skill **`api-routes`**.
- Public read: **`GET /api/crates/public/[id]`**, page **`/crate/[id]`** — [`PublicCrateClient`](../../src/components/PublicCrate/PublicCrateClient.component.tsx).

## Drawer vs detail

Drawer lists releases in **`sort_order`** **without** section markers; owner page includes markers and full layout tools.

## Sync

One automatic **`POST /api/crates/sync`** per username visit after collection load; manual sync in Settings on failure.
