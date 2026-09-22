---
name: handbook-routing
description: >-
  Which handbook chapter to read before coding. Use at the start of substantive
  tasks (features, refactors, API, CSS, tests).
---

# Handbook routing

Source of truth: **`docs/handbook/`**. Task map: **[`llms.md`](../../docs/handbook/llms.md)**.

## Workflow

1. Skim [`README.md`](../../docs/handbook/README.md) index if unfamiliar.
2. Open **`llms.md`** → read **every row** that matches your task **before** the first code change.
3. Reuse documented patterns — extend existing hooks/components; no parallel implementations.
4. If behavior or conventions change → update the matching **`docs/handbook/*.md`** (and root **README** if Features/Pages/Setup/Tech Stack shift).

## Substantive vs skip

**Read chapters:** features, refactors, auth, Prisma, App Router handlers, CSS/layout, new test behavior.

**May skip full pass:** obvious typos, single-line fixes with unchanged behavior.

## Agent entry points

- **[AGENTS.md](../../AGENTS.md)** / **[CLAUDE.md](../../CLAUDE.md)** — align with handbook.
- **Cursor** — session injects `llms.md`; always-on rule in [`.cursor/rules/filtermydiscogs-handbook.mdc`](../../.cursor/rules/filtermydiscogs-handbook.mdc).
