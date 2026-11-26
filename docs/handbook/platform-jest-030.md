## Jest

[`jest.config.ts`](../../jest.config.ts) uses **`next/jest`** with **`jest-fixed-jsdom`** (Node **`fetch`** / **`Response`** streams for MSW 3; not plain **`jest-environment-jsdom`**) and:
- **`test-utils`** alias → [`src/tests/utils/test-utils.tsx`](../../src/tests/utils/test-utils.tsx)
- **`src/`** path alias
- SVG and CSS mocks under **`.jest/`**
- Custom **`transformIgnorePatterns`** for pnpm layout + **`@faker-js/faker`**, **`jotai`**, TanStack packages, **`d3-shape`**, and **`msw`** / **`@msw`** / **`@mswjs`** (see [`jest.config.ts`](../../jest.config.ts))
- **MSW setup**: [`.jest/mswPolyfills.ts`](../../.jest/mswPolyfills.ts) in **`setupFiles`** (Web Streams, **`Response.error`**, and a **`fetch`** wrapper so relative **`/api/*`** URLs resolve under **`jest-fixed-jsdom`**’s Node **`fetch`**); [`.jest/setupMswForApiSpecs.ts`](../../.jest/setupMswForApiSpecs.ts) in **`setupFilesAfterEnv`** registers MSW for **`src/api/helpers.spec.ts`** and **`src/api/endpoints/*.spec.ts`** only (route handler specs mock server deps, not **`fetch`**); regenerated **[`public/mockServiceWorker.js`](../../public/mockServiceWorker.js)** stays in repo for **`msw init`** / **`package.json`** **`msw.workerDirectory`** and is excluded from Biome ([`biome.json`](../../biome.json))
- **`verbose: false`** by default (pass **`--verbose`** when debugging a single suite)
- **`workerIdleMemoryLimit: "512MB"`** so parallel workers recycle before idle heap grows without bound
- **`NODE_OPTIONS='--max-old-space-size=4096'`** on **`pnpm test`**, **`pnpm test:ci`**, and coverage. **`pnpm test:ci`** / **`test:ci:shard`** use parallel workers (**`--maxWorkers=50%`**). **`pnpm test`** / **`test:file`** / **`test:coverage`** keep **`--runInBand --detectOpenHandles`** for local leak debugging (slower full-suite run).
- **Global setup memory**: [`.jest/setupTests.ts`](../../.jest/setupTests.ts) mocks **`HTMLElement.prototype.getBoundingClientRect`** once in **`beforeAll`** (not **`beforeEach`**). Per-test **`spyOn`** on prototypes stacked ~1.3k wrappers and OOM’d parallel runs; do not move shared prototype mocks back into **`beforeEach`** without **`restoreAllMocks`** / a non-stacking pattern (see **`setupMockMatchMedia`**).
- **Local sharding (optional)**: **`pnpm test:ci:shard`** with **`JEST_SHARD=1/3`** … **`3/3`** splits ~274 suites across processes when debugging memory or comparing to CI. CI runs the full **`pnpm test:ci`** in the **Unit gates** job. Do not pass **`--shard`** via **`pnpm test:ci -- …`** — pnpm inserts **`--`**, which Jest treats as end-of-options.

Faker, Jotai, TanStack Table, TanStack Charts, and MSW transpilation depends on **`transpilePackages`** in `next.config.ts` **and** excluding those packages from the custom ignore pattern.

