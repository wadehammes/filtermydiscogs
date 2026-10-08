## Problem

What user or maintainer problem does this change address?

## Solution

How does this PR solve it? Link handbook chapters if behavior or conventions shifted.

## Handbook

- [ ] I read **`docs/handbook/llms.md`** for this area before coding (or this PR is a trivial mechanical fix).
- [ ] **`docs/handbook/*.md`** updated in this PR **or** I verified these sections are still accurate (list headings):
  - _e.g. conventions.md → Jest notes; platform.md → Jest_
- [ ] Root **`README.md`** updated if Features, Pages, Setup, or Tech Stack changed.

## Checks

- [ ] **`pnpm lint:all`** (or **`mise run pr-prep`** before push)
- [ ] **`pnpm handbook:check`** when changing **`src/`** or test infra (handbook sync + playback/util/hook **spec pairing** vs **`origin/staging`**)
- [ ] Tests added/updated for new behavior (TDD where applicable)

## Screenshots / video

Where helpful for UI changes.
