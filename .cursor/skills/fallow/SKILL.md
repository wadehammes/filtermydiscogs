---
name: fallow
description: >-
  Optional codebase intelligence via Fallow MCP and CLI. Use for PR audit, dead code
  traces, duplication, health score, guard boundaries, or fallow commands.
---

# Fallow (this repo)

- **MCP:** [`.cursor/mcp.json`](../../.cursor/mcp.json) — use **`fallow`** namespace tools in agent sessions.
- **Config:** [`.fallowrc.jsonc`](../../.fallowrc.jsonc). **CI dead-code gate** stays **`pnpm knip:ci`**, not Fallow.
- **Task map:** [`AGENTS.md`](../../AGENTS.md) (also in session hooks).
- **Full skill + CLI flags:** `node_modules/fallow/skills/fallow/SKILL.md` after **`pnpm install`** — read before non-trivial analysis; resolve flags from `fallow --help`, not memory.
- **Refresh MCP after upgrade:** `pnpm exec fallow agent install --harness cursor --without hooks --without skill`

Common: `pnpm fallow:audit`, `pnpm fallow:health`, `fallow dead-code --trace <file>:<export>`.
