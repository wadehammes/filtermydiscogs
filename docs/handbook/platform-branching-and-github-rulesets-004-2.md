**Who can cut a release.** GitHub tag push needs repo **admin** (or ruleset bypass) for **`v*`** tags. The workflow push to **`main`** uses **`RELEASE_PUSH_TOKEN`**, not the tagger’s identity. The local gate for production impact is **Vercel**: **`make release`** runs [`scripts/verify-vercel-for-release.sh`](../../scripts/verify-vercel-for-release.sh) first and refuses anyone whose Vercel team role on **`worldwadeweb`** (override with **`VERCEL_TEAM_ID`**) is below **Member** — **Developer** and lower cannot run release. That person also needs **`vercel login`** or **`VERCEL_TOKEN`** locally.

**Local `make release`:** run from **`staging`** only ([`Makefile`](../../Makefile)); **`verify-vercel-team`** then tag push (Git may print **Bypassed rule violations** on tag create — expected). After the push, [`scripts/watch-release.sh`](../../scripts/watch-release.sh) polls **`create-release`** and runs **`gh run watch`** when the **GitHub CLI** is installed; without **`gh`**, the tag still releases and the script prints the Actions URL. Ensure **`RELEASE_PUSH_TOKEN`** is configured so Reset Main can update **`main`**.

**Maintain rulesets (API):** canonical JSON under [`.github/rulesets/`](../../.github/rulesets/). Re-apply after edits:

```bash
gh api --method PUT repos/wadehammes/filtermydiscogs/rulesets/23658577 --input .github/rulesets/production-main.json
gh api --method PUT repos/wadehammes/filtermydiscogs/rulesets/23658599 --input .github/rulesets/trunk-staging-protect-ref.json
gh api --method PUT repos/wadehammes/filtermydiscogs/rulesets/23658600 --input .github/rulesets/trunk-staging-pr-ci.json
gh api --method PUT repos/wadehammes/filtermydiscogs/rulesets/23658836 --input .github/rulesets/release-tags-v.json
```

List live rulesets: **`gh api repos/wadehammes/filtermydiscogs/rulesets`**

**Note:** The release job runs **`git push origin <tag-ref>:main`**. If **`main`** ever diverges from the tagged commit, that update may be rejected while force pushes are blocked. Prefer tagging a commit that **fast-forwards** **`main`**, or grant **narrow bypass** for the release workflow only (not broad **Write** access).

**Ruleset 3 — `Release tags — v*`** (id **23658836**): target **`refs/tags/v*`**; **`creation`** / **`update`** / **`deletion`** require bypass (repo **admin** only) so only maintainers can create **`v*`** tags that trigger [release.yml](../../.github/workflows/release.yml).

### Verify after enabling rulesets

| Action                                                                 | Expected                                                              |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `git push origin main` (human)                                         | Denied                                                                |
| PR into **`main`**                                                     | Blocked or non-mergeable for contributors                             |
| PR into **`staging`** without green **`Unit gates`** + **`E2E smoke`** | Blocked                                                               |
| `make release tag=vX.Y.Z` from an allowed maintainer                   | Tag push → **`create-release`** → **`main`** updates → GitHub Release |

Local Biome “changed files” checks use **`origin/staging`** as the baseline ([`package.json`](../../package.json) **`lint:check`**) so they match trunk, not production.

