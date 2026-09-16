# Git hooks (optional local install)

Tracked hooks for contributors who want Git itself to enforce the same rules as Cursor agents.

## Enable

From the repo root:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/*
```

## Hooks

| Hook | Purpose |
|------|---------|
| `commit-msg` | Rejects messages containing `Co-authored-by:` trailers |

Cursor agents must commit via `scripts/git-commit.sh` (enables this hook path for one command). See `.cursor/hooks/block-co-authored-by-commit.sh`.
