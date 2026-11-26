## mise

[mise.toml](../../mise.toml) adds project tasks and env on top of [`.tool-versions`](../../.tool-versions) (Node + pnpm).

### Tool versions

| Tool   | Pin (see [`.tool-versions`](../../.tool-versions)) | Also declared in |
| ------ | -------------------------------------------------- | ---------------- |
| Node   | **26.x** (currently **`nodejs 26.13.0`**)          | —                |
| pnpm   | **12.x** (currently **`pnpm 12.16.1`**)            | **`package.json`** **`packageManager`** |

**CI:** [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) and [`.github/workflows/e2e-full.yml`](../../.github/workflows/e2e-full.yml) read the **`nodejs`** line from **`.tool-versions`** for **`actions/setup-node`** — no hardcoded Node version in workflows.

**After bumping Node in `.tool-versions`:** `mise install` (or `mise up`), then **`mise bootstrap`** (or **`pnpm install`**) so native addons (**sharp**, Prisma engines, etc.) match the new runtime; run **`mise run ci`** or **`pnpm test:ci`** before push. Confirm **`node -v`** in your shell matches mise (**`mise current nodejs`**) — a system Node on **`PATH`** ahead of mise shims causes drift.

**Types:** devDependency **`@types/node`** tracks the same major line as the pin (currently **`^26`**).

**Vercel:** Set the project **Node.js Version** to match **`.tool-versions`** so serverless builds and local/CI use the same runtime.

Public setup prerequisites remain in the root **[README.md](../../README.md)** (Setup → Prerequisites).

| Command              | Purpose                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `mise install`       | Install Node/pnpm from `.tool-versions`.                                                  |
| `mise bootstrap`     | Install tools, then run the **`bootstrap`** task (`pnpm install` + `pnpm db:generate`).   |
| `mise run bootstrap` | JS deps + Prisma generate only (tools already installed).                                 |
| `mise run ci`        | Same as PR Actions: unit gates + **`pnpm test:e2e:smoke:ci`**.                            |
| `mise run ci-full`   | Unit gates + full **`pnpm test:e2e:ci`** (matches **E2E full** on push to **`staging`**). |

`[env]` loads **`.env.local`** (redacted in mise output) for shells and tasks in this repo. Create that file from the root README before DB/OAuth work; a missing file is harmless.

First time in a clone: `mise trust` if prompted, then `mise bootstrap`.

