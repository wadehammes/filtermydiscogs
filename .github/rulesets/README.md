# Repository rulesets

GitHub **rulesets** for **`staging`** (trunk) and **`main`** (production). Full policy: [`docs/handbook/platform.md`](../../docs/handbook/platform.md#branching-and-github-rulesets).

| File | Ruleset | ID |
|------|---------|-----|
| `production-main.json` | Production — main | 23658577 |
| `trunk-staging-protect-ref.json` | Trunk — staging (protect ref) | 23658599 |
| `trunk-staging-pr-ci.json` | Trunk — staging (PR & CI) | 23658600 |
| `release-tags-v.json` | Release tags — v* | 23658836 |

Apply after editing JSON (requires admin auth):

```bash
gh api --method PUT repos/wadehammes/filtermydiscogs/rulesets/23658577 --input .github/rulesets/production-main.json
gh api --method PUT repos/wadehammes/filtermydiscogs/rulesets/23658599 --input .github/rulesets/trunk-staging-protect-ref.json
gh api --method PUT repos/wadehammes/filtermydiscogs/rulesets/23658600 --input .github/rulesets/trunk-staging-pr-ci.json
gh api --method PUT repos/wadehammes/filtermydiscogs/rulesets/23658836 --input .github/rulesets/release-tags-v.json
```

New rulesets use **`POST .../rulesets`** instead of **`PUT`**.
