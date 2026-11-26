# Fallow (ad-hoc analysis)

**CI:** `pnpm knip:ci`; `pnpm fallow:audit:ci` is advisory; local **`pnpm fallow:audit`** / **`mise run pr-prep`** can fail on new findings.

| When the agent is about to… | Run |
| --------------------------- | --- |
| Delete an export or file | `fallow dead-code --trace <file>:<export>` |
| Trace consumers before refactor | `fallow dead-code --type-aware --symbol-impact <file>:<symbol>` |
| Path between modules | `fallow trace --path <from> <to>` |
| Delete a dependency | `fallow dead-code --trace-dependency <name>` |
| Commit or open a PR | `fallow audit --base <ref>` |
| Prioritize refactors | `fallow health --hotspots --targets` |

More commands: Fallow MCP or [platform.md](platform.md). Moved from lean [AGENTS.md](../../AGENTS.md).