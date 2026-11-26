## Branching and GitHub rulesets

| Branch        | Role                                                                                                                                |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **`staging`** | Default **trunk** — feature work, stacked PRs, CI, Vercel **Preview** / staging deploys.                                            |
| **`main`**    | **Production only** — updated by the release workflow when a **`v*`** tag is pushed; Vercel **Production** should track **`main`**. |

**Contributors:** open PRs into **`staging`** only. Do not push to **`main`** or open PRs targeting **`main`**.

### Repository settings (once per repo)

1. **Settings → General → Default branch** → **`staging`** (so clones, “Compare & pull request”, and new forks target trunk).
2. **Settings → Collaborators** — grant **Write** only to people who merge to **`staging`**; everyone else **Read** / **Triage** as appropriate.
3. **Dependabot / Code scanning** — target **`staging`** (not **`main`**).
4. Migrate legacy **branch protection** on **`staging`** / **`main`** into **rulesets** in one pass so there is no gap.

### Ruleset 1 — `Trunk — staging` (two rulesets on the same ref)

**Target:** `refs/heads/staging` — implemented as **`Trunk — staging (protect ref)`** (id **23658599**) and **`Trunk — staging (PR & CI)`** (id **23658600**)

| Rule                                       | Setting                                                                                                 |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Restrict deletions                         | On                                                                                                      |
| Block force pushes                         | On                                                                                                      |
| Require a pull request                     | On (direct pushes off, or admins only if you need hotfixes)                                             |
| Require status checks                      | On — required checks: **`Unit gates`** and **`E2E smoke`** ([`ci.yml`](../../.github/workflows/ci.yml)) |
| Require branches up to date before merging | On (recommended)                                                                                        |

Do **not** add an **`update`** rule on **`staging`**: it restricts _all_ ref updates to bypass actors and blocks normal **Squash and merge** on PRs (“Cannot update this protected ref”). Use **`pull_request`** + status checks to gate merges; reserve **`update`** for **`main`** only.

**Bypass:** repo **admin** only (break-glass direct pushes if ever needed).

### Ruleset 2 — `Production — main` (id **23658577**)

**Target:** `refs/heads/main`

| Rule                   | Setting                                   |
| ---------------------- | ----------------------------------------- |
| Restrict deletions     | On                                        |
| Block force pushes     | On                                        |
| Require a pull request | **Off** (production is not merge-driven)  |
| Restrict who can push  | On — **no human teams** on the allow list |

**Who may update `main`:** only [`.github/workflows/release.yml`](../../.github/workflows/release.yml) after **`make release tag=vX.Y.Z`**. The **`Production — main`** ruleset **`update`** rule blocks the default **`GITHUB_TOKEN`** push; the **Reset Main** step uses repository secret **`RELEASE_PUSH_TOKEN`** (fine-grained or classic **PAT** with **Contents** read/write on this repo). The PAT **owner** must appear on the ruleset **bypass** list ([`production-main.json`](../../.github/rulesets/production-main.json) includes repo **admin** role and the maintainer user used for release automation). **`GITHUB_TOKEN`** is **not** a bypass for **`update`** (do not rely on **`github-actions[bot]`** on the bypass list). Repo **admins** can also push **`refs/tags/vX.Y.Z:main`** locally (ruleset bypass).

**If Reset Main fails with `Cannot update this protected ref` but the secret is set:** first confirm the job is not still pushing as **`github-actions[bot]`** — [`release.yml`](../../.github/workflows/release.yml) checkout must use **`persist-credentials: false`** (otherwise the default checkout credential overrides the PAT in the remote URL). Then confirm the PAT owner is on the bypass list: regenerate on the **same GitHub user** listed in **`production-main.json`** (or add that user on ruleset **23658577**), and re-test locally before re-running Actions:

```bash
curl -sS -H "Authorization: Bearer YOUR_PAT" https://api.github.com/user | jq -r .login
git push "https://x-access-token:YOUR_PAT@github.com/wadehammes/filtermydiscogs.git" refs/tags/vX.Y.Z:main
```

Success looks like **`Bypassed rule violations`** (same as a manual admin push), not **`push declined due to repository rule violations`**.

**Tag push message:** **`Release tags — v*`** restricts tag **creation**; admins see `Bypassed rule violations… Cannot create ref due to creations being restricted` while the tag still lands — expected when you have admin bypass.

