#!/usr/bin/env bash
# Follow the create-release run for a freshly pushed tag and report the outcome.
# The tag is already pushed by the time this runs, so a problem here is a problem
# with the release workflow, never a reason to re-tag.
set -euo pipefail

tag="${1:-}"
if [[ -z "${tag}" ]]; then
	echo "usage: watch-release.sh <tag>" >&2
	exit 1
fi

repo="${GITHUB_REPOSITORY:-}"
if [[ -z "${repo}" ]] && command -v gh >/dev/null; then
	repo="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
fi
repo="${repo:-wadehammes/filtermydiscogs}"
actions_url="https://github.com/${repo}/actions/workflows/release.yml"

# gh is optional: without it the release still runs, we just cannot follow it.
if ! command -v gh >/dev/null; then
	printf '\nPushed %s. Install the GitHub CLI to follow the run from here.\n' "${tag}"
	printf '  %s\n' "${actions_url}"
	printf '  (Remote "Bypassed rule violations" on v* tag push is expected under rulesets.)\n'
	exit 0
fi

# GitHub creates the run asynchronously after the push, so poll until it shows up.
# For a tag push the run's headBranch is the tag name.
run_id=""
for _ in $(seq 1 30); do
	run_id="$(gh run list --repo "${repo}" --workflow=release.yml --branch "${tag}" \
		--limit 1 --json databaseId --jq '.[0].databaseId // empty' 2>/dev/null || true)"
	[[ -n "${run_id}" ]] && break
	sleep 2
done

if [[ -z "${run_id}" ]]; then
	printf '\nPushed %s, but no create-release run appeared within 60s.\n' "${tag}" >&2
	printf '  %s\n' "${actions_url}" >&2
	exit 1
fi

printf '\nPushed %s. Watching create-release (run %s)...\n\n' "${tag}" "${run_id}"

if ! gh run watch "${run_id}" --repo "${repo}" --exit-status; then
	printf '\ncreate-release FAILED for %s. The tag is pushed; fix the workflow and re-run it.\n' "${tag}" >&2
	printf '  https://github.com/%s/actions/runs/%s\n' "${repo}" "${run_id}" >&2
	exit 1
fi

release_url="$(gh release view "${tag}" --repo "${repo}" --json url --jq .url 2>/dev/null || true)"
if [[ -z "${release_url}" ]]; then
	printf '\ncreate-release succeeded but no release is published for %s yet.\n' "${tag}" >&2
	printf '  https://github.com/%s/actions/runs/%s\n' "${repo}" "${run_id}" >&2
	exit 1
fi

printf '\nRelease %s published, main fast-forwarded.\n' "${tag}"
printf '  %s\n' "${release_url}"
