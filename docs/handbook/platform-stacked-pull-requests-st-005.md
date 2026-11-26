## Stacked pull requests (`st`)

**Non-negotiable:** substantive work and agent sessions use **gh-stack** through **`st`** ([conventions.md → Non-negotiables §8](conventions.md#non-negotiables-substantive-work-and-agents)) — a **stack** of branches into **`staging`** (each PR’s base is the branch below it), not parallel **`git checkout -b …`** off **`staging`** or one oversized branch mixing unrelated concerns. Use the **`st`** wrapper around the [`github/gh-stack`](https://github.com/github/gh-stack) extension ([`gh-stack.zsh` gist](https://gist.github.com/wadehammes/1bcc3aad88f876e3ac68e642df2899b5)) — install **`gh extension install github/gh-stack`**, source **`~/.gh-stack.zsh`** (or **`st upgrade`** to refresh from the gist), then **`st cheatsheet`** for the full command map.

| Step                                   | Command                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Create / adopt branches (bottom → top) | `st init branch-a branch-b` (trunk defaults to **`staging`**)                                   |
| Add a layer + commit                   | `git add …` + `git commit …`, then `st add next-branch` (or `st add -Am "message" next-branch`) |
| Rebase the chain                       | `st sync` or `st rebase`                                                                        |
| Push + open/update PRs                 | `st ss --auto` (alias for `st submit --auto`)                                                   |
| Inspect stack                          | `st view --json`                                                                                |
| Share stack (Slack/Teams)              | `st print-stack-list` (`-c` copies); `-S` prepends `https://github.com/{owner}/{repo}/stack/{N}` when GitHub has linked **two or more** PRs |

Keep **`github/gh-stack` v0.3.0+** (`gh extension upgrade stack` or **`st upgrade-all`**) for stack page URLs, atomic push/sync, and base retargeting. **`st upgrade`** refreshes **`gh-stack.zsh`** from the [gist](https://gist.github.com/wadehammes/1bcc3aad88f876e3ac68e642df2899b5).

**GitHub stack pages:** A single open PR after **`st ss --auto`** does not create a **`/stack/N`** URL yet — GitHub creates the remote stack object when **two or more** PRs are linked (same rule as **`gh stack sync`**). Until then, **`st print-stack-list -S`** prints the usual PR bullet list and notes on stderr that there is no stack page to prepend; avoid duplicating the PR URL on its own line.

**Agents:** Plan layers **before** coding (foundation → tests → follow-ups). Commit **one concern per branch**; use **`st bottom`** / **`st up`** to move between layers. Prefer **`st`** over raw **`gh stack`** so local workflows match maintainer scripts. Non-interactive automation must pass flags documented in **`st cheatsheet`** (e.g. **`st ss --auto`**, **`st view --json`**, **`st print-stack-list -c`** for review paste; **`-S`** only when the stack page exists).

**Local stack metadata:** gh-stack may write repo-local JSON (sometimes a root **`.json`** file). It is **not** product config — **[`.gitignore`](../../.gitignore)** ignores **`/.json`**; never commit stack state with application changes.

