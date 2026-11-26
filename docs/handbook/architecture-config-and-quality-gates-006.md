## Config and quality gates

- **[`next.config.ts`](../../next.config.ts)** — env exposure, Discogs image hosts, CSP/security headers, SVGR, `transpilePackages` for Jest/Faker.
- **[`biome.json`](../../biome.json)** — lint and format rules.
- **[`knip.json`](../../knip.json)** — CI unused export/file detection.
- **[`.fallowrc.jsonc`](../../.fallowrc.jsonc)** — optional Fallow config (agent/ad-hoc analysis; mirrors Knip ignores where practical). See [platform.md](platform.md).
- **[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)** — PR checks into `staging`: parallel **Unit gates** (`tsc:ci`, `lint:ci`, `lint:css`, handbook sync, `test:ci`, `knip:ci`) and **E2E smoke** (`build:e2e`, `test:e2e:smoke`); full Playwright on push via **`e2e-full.yml`**.

Branching and releases are described in the root [README.md](../../README.md).

