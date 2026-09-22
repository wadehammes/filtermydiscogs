---
name: stacked-prs
description: >-
  Create and manage stacked PRs into staging with st (gh-stack). Use when splitting
  large work, dependent branches, st init/add/sync/ss, or gh stack workflows.
---

# Stacked PRs (`st`)

Trunk is **`staging`**, not `main`. Full policy: [platform.md → Stacked pull requests](../../docs/handbook/platform.md#stacked-pull-requests-st).

## Prerequisites

```bash
gh extension install github/gh-stack
# source ~/.gh-stack.zsh (or st upgrade) — see platform.md
```

## Workflow

| Step | Command |
|------|---------|
| Create stack (bottom → top) | `st init branch-a branch-b` |
| Add layer after commits on current branch | `st add next-branch` |
| Rebase chain | `st sync` or `st rebase` |
| Push + open/update PRs | `st ss --auto` |
| Inspect | `st view --json` |

Plan layers **before** coding: schema/API → consumers → UI/tests. **One concern per branch**; use `git add` + `git commit` deliberately per layer.

## Agent rules (non-interactive)

- **`st ss --auto`** — never bare `st submit` (prompts for titles).
- **`st view --json`** — never bare `st view` (TUI hangs).
- **`st init` / `st add`** — always pass branch name arguments.
- Commits: prefer **`scripts/git-commit.sh`** (repo commit-msg hooks); Cursor blocks raw `git commit`.
- Prefer **`st`** over raw **`gh stack`** so flags match maintainer scripts (`st cheatsheet`).
