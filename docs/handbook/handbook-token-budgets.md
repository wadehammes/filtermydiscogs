# Handbook token budgets

Kickoff-style limits enforced by [`handbookTokenBudgets.spec.ts`](../../src/tests/utils/handbookTokenBudgets.spec.ts) in **`pnpm handbook:audit`**.

| Surface | Budget (~chars÷4) |
| ------- | ----------------- |
| Session start: `AGENTS.md` + **table rows only** from `llms.md` | 2,000 |
| Each `docs/handbook/**/*.md` | 1,500 |
| `.cursor/commands/handbook-review.md` | 1,500 |

Implementation: [`handbookTokenBudgets.ts`](../../src/tests/utils/handbookTokenBudgets.ts). Oversized legacy chapters are split into part files; hubs may link to [paginated indexes](components-index-001.md). **`LEGACY_OVERSIZED_PAGES`** is empty — all pages must pass.