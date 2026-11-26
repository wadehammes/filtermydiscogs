## Client integration

- **`CrateProvider`** + **`useCrateMutations`** ([`src/hooks/mutations/useCrateMutations.ts`](../../src/hooks/mutations/useCrateMutations.ts)) call the crate API via **`api.*`** in [`src/api/urls.ts`](../../src/api/urls.ts) — including **`api.migrateLegacyCrate`**, **`api.releaseCrateMembership`**, and **`api.setReleaseCrateMembership`**.
- **`useCrateMigration`** handles legacy localStorage → server migration on login via **`useMigrateLegacyCrateMutation`** → **`POST /api/crates/migrate`** (one request, then invalidates crate queries).
- **Client crate fetches:** [`fetchCrates`](../../src/api/endpoints/crates.ts), [`fetchCrate`](../../src/api/endpoints/crates.ts), and [`fetchPublicCrate`](../../src/api/endpoints/crates.ts) request **`?all=true`** so the UI loads full lists in one round trip.

