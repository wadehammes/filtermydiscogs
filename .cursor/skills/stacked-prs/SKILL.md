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

| Step                                      | Command                     |
| ----------------------------------------- | --------------------------- |
| Create stack (bottom → top)               | `st init branch-a branch-b` |
| Add layer after commits on current branch | `st add next-branch`        |
| Rebase chain                              | `st sync` or `st rebase`    |
| Push + open/update PRs                    | `st ss --auto`              |
| Inspect                                   | `st view --json`            |
| Share for review (Slack/Teams)            | `st print-stack-list -c`    |

Plan layers **before** coding: schema/API → consumers → UI/tests. **One concern per branch**; use `git add` + `git commit` deliberately per layer.

**Stack page URL:** GitHub exposes `https://github.com/{owner}/{repo}/stack/{N}` only after **two or more** PRs are linked. Use **`st print-stack-list -S`** (optionally with **`-c`**) once that exists; with a single PR, skip **`-S`** or expect a stderr note and PR-only bullets (no duplicate header link). Prefer **`gh extension upgrade stack`** / **`st upgrade-all`** for **gh-stack v0.3.0+**.

## Agent rules (non-interactive)

- **`st ss --auto`** — never bare `st submit` (prompts for titles).
- **`st view --json`** — never bare `st view` (TUI hangs).
- **`st init` / `st add`** — always pass branch name arguments.
- Commits: prefer **`scripts/git-commit.sh`** (repo commit-msg hooks); Cursor blocks raw `git commit`.
- Prefer **`st`** over raw **`gh stack`** so flags match maintainer scripts (`st cheatsheet`).
- **`st print-stack-list -c`** for paste-friendly review lists; **`-S`** only when sharing the GitHub stack page (multi-PR stacks).
