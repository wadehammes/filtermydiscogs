## Formatting and linting

**Biome** is the single source for JS/TS lint and format. **Stylelint** covers CSS.
- **Braces**: Always `{}` for control flow, including single-line bodies. No `if (!x) return null` on one line—use a block.
- **Commands**:
  - `pnpm lint` — Biome check
  - `pnpm lint:fix` — `biome check --fix`
  - `pnpm lint:check` — Biome on changed files since `origin/staging` (trunk baseline)
  - `pnpm lint:css` / `pnpm lint:css:fix` — Stylelint over `src/**/*.css`
  - `pnpm lint:all` — `lint:check` then `lint:css:fix`
  - `pnpm tsc:ci` — `db:generate` then strict TypeScript (`tsc --strict`)
- **Configs**: [`biome.json`](../../biome.json), [`stylelint.config.mjs`](../../stylelint.config.mjs).
- **Handbook tables:** Biome 2.6.2’s Markdown formatter never settles on wide handbook tables — each **`biome check --write`** can flip column-padding by one space (notably [`platform.md`](platform.md) package-script tables). The formatter is off for all **`docs/handbook/**/*.md`** in [`biome.json`](../../biome.json); the linter still runs.
- **CI**: `pnpm lint:ci`, `pnpm lint:css`, `pnpm test:ci` (parallel Jest, **`--maxWorkers=50%`**), `pnpm knip:ci` (see [platform.md](platform.md)). Local **`pnpm test`** stays **`--runInBand --detectOpenHandles`** for open-handle debugging.
- **Stacked PRs:** Each branch tip in a dependency stack should pass **`pnpm lint:all`** on its own (Biome uses **`--changed --since origin/staging`**, so the check is cumulative from trunk). Fix lint/Knip on the **lowest** branch that introduces the failure, then **`gh stack rebase --upstack`** — do not pile unrelated fixes on the top PR only.
