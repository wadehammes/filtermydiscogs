## Releases

Production promotion is **tag-driven**, not a merge into **`main`**:
1. Merge and validate work on **`staging`** (CI green on the PR).
2. From **`staging`** (or a release commit reachable from it), run **`make release tag=vX.Y.Z`** ([`Makefile`](../../Makefile)) — pushes a **`v*`** tag.
3. [`.github/workflows/release.yml`](../../.github/workflows/release.yml) (**`create-release`**) on tag push: updates **`main`** to that ref, generates changelog, creates the GitHub Release.

See [Branching and GitHub rulesets](#branching-and-github-rulesets) for protecting **`main`** and the maintainer release flow (fork contributors can ignore this section).

