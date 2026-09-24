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

## Post-work (before your final reply)

When the session changed **`src/`** (especially production code, layout libs, or new test patterns):

1. Open **`llms.md`** and the chapter(s) it maps for this area.
2. **Edit handbook** in the same turn if anything documented is now wrong or missing.
3. If you truly changed nothing doc-worthy, **name the section headings you checked** — not a bare “handbook still accurate.”
4. Cursor **`stop`** runs [`.cursor/hooks/handbook-drift-check.sh`](../../.cursor/hooks/handbook-drift-check.sh) once when git shows `src/` changes without `docs/handbook/*.md` — treat that follow-up as mandatory completion, not optional.

## Substantive vs skip

**Read chapters:** features, refactors, auth, Prisma, App Router handlers, CSS/layout, new test behavior.

**May skip full pass:** obvious typos, single-line fixes with unchanged behavior.

## Agent entry points

- **[AGENTS.md](../../AGENTS.md)** / **[CLAUDE.md](../../CLAUDE.md)** — align with handbook.
- **Cursor** — sessionStart brief handbook pointer; always-on rule in [`.cursor/rules/filtermydiscogs-handbook.mdc`](../../.cursor/rules/filtermydiscogs-handbook.mdc).
