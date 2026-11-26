| `name`           | Display name                                                                                                                                           |
| `username`       | Discogs username (for public crate attribution)                                                                                                        |
| `is_default`     | One default crate per user                                                                                                                             |
| `private`        | When `false`, crate is publicly viewable at `/crate/[id]`                                                                                              |
| `packed_enabled` | When `true`, owner sees gig-packing checklist UI on the crate detail page ([`/crates/[id]`](../../src/app/crates/[id]/page.tsx); default **`false`**)  |
| `notes`          | Optional free-text notes for the crate; editable in **Edit crate** and the owner detail page set-notes scratchpad (not exposed on public crate routes) |

Composite primary key: **`[user_id, id]`**.

### `CrateRelease`

Stores a release snapshot as **`release_data` JSON** keyed by Discogs **`instance_id`**. Optional **`found_at`** timestamp marks albums **packed for a gig** (owner-only; not exposed on public crate routes). **`sort_order`** controls display order within a crate (ascending; spaced by 1000; backfilled from **`added_at DESC`** on migration).

Composite primary key: **`[user_id, crate_id, instance_id]`**. Cascades on crate delete.

### `CrateSetMarker`

Owner-only section labels within a crate layout (e.g. “Peak hour”, nested “Deep House” under “Early Set”). Composite primary key: **`[user_id, crate_id, id]`** (UUID). **`sort_order`** interleaves with releases in the unified layout. Optional **`parent_id`** (self-FK, max depth 2) for nested groups; optional **`accent_key`** (curated palette → `--crate-section-accent-*` in [`base.css`](../../src/styles/themes/base.css)). Not returned on public crate routes.

