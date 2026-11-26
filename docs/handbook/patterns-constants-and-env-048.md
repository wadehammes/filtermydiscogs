## Constants and env

- Shared literals live in [`src/constants.ts`](../../src/constants.ts) and topic files under [`src/constants/`](../../src/constants/) (e.g. [`sortValues.ts`](../../src/constants/sortValues.ts), mosaic sizes)—not magic strings in components.
- Runtime **`process.env.*`** keys that must reach the browser need to be listed under **`env`** in [`next.config.ts`](../../next.config.ts). OAuth secrets stay **server-only** unless intentionally exposed for OAuth initiation.
- URL helpers: [`getSiteUrl`](../../src/utils/helpers.ts) for site base URLs.

