# Agent instructions

**Before any work in this repo**, read **`docs/handbook/README.md`** and the handbook **chapter** that matches the task. Use **`docs/handbook/llms.md`** for a compact task→chapter map (helpful for routing or for pasting into other tools).

Follow documented patterns.

**Testing (substantive work):** Follow [conventions.md → Non-negotiables](docs/handbook/conventions.md#non-negotiables-substantive-work-and-agents)—**TDD**, **factories** ([factories.md](docs/handbook/factories.md)), **one flat `describe`** per hook spec ([checklist](docs/handbook/conventions.md#hook-and-feature-spec-checklist)). Do not implement hooks first and backfill specs.

**Keep docs accurate:** Whenever a change would make the handbook wrong or incomplete—new flows (CI, env, auth cookies), moved files, component or convention changes, Discogs/Prisma patterns, or anything a future reader would be misled by—update the relevant **`docs/handbook/*.md`** in the **same PR** when practical, or in a small follow-up right away. When the change shifts **user-facing features, routes, setup, or tech stack** listed in the root **[README.md](./README.md)**, update that file too. Do not leave docs stale on purpose.

**Stacked PRs:** Use **`st`** ([`gh-stack.zsh`](https://gist.github.com/wadehammes/1bcc3aad88f876e3ac68e642df2899b5) + **`gh extension install github/gh-stack`**) for dependent PRs into **`staging`** — **`st init`**, per-layer commits, **`st add`**, **`st sync`**, **`st ss --auto`**. See [platform.md → Stacked pull requests](docs/handbook/platform.md#stacked-pull-requests-st).
