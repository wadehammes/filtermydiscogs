---

description: Review branch changes against docs/handbook and AGENTS.md conventions.
argument-hint: "[base branch or file paths]"
---

Review branch changes against the handbook; **do not edit code or handbook** in this turn. After the report, reply **go** for a fix pass + **`pnpm lint:all`**.

**Procedure:** Full steps in [agent-workflow-review.md](docs/handbook/agent-workflow-review.md). Summary:

1. Resolve base ref (PR parent for stacks, else **`staging`**); diff from merge base + uncommitted work; scope **`src/`** and paired test/config paths.
2. Read [non-negotiables.md](docs/handbook/non-negotiables.md), route via [llms.md](docs/handbook/llms.md), load skills only when routed.
3. **`pnpm exec biome check <files>`** (no `--write`); **`pnpm lint:css`** if CSS changed.
4. Report by file: `path:line`, handbook link, suggested fix; linters + clean files + handbook gaps.

Arguments: **$ARGUMENTS** — paths, branch name, or empty for PR base.
