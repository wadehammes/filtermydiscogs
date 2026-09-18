#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

token="${VERCEL_TOKEN:-}"
if [[ -z "${token}" ]]; then
	xdg_data="${XDG_DATA_HOME:-${HOME}/.local/share}"
	auth_candidates=()
	if [[ -n "${APPDATA:-}" ]]; then
		auth_candidates+=("${APPDATA}/xdg.data/com.vercel.cli/auth.json")
	fi
	auth_candidates+=(
		"${HOME}/Library/Application Support/com.vercel.cli/auth.json"
		"${xdg_data}/com.vercel.cli/auth.json"
		"${HOME}/.config/com.vercel.cli/auth.json"
		"${HOME}/.config/vercel/auth.json"
		"${HOME}/.now/auth.json"
	)
	for auth in "${auth_candidates[@]}"; do
		if [[ -f "${auth}" ]]; then
			token="$(node -e "const fs=require('fs');const j=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));process.stdout.write(j.token||'')" "${auth}")"
			[[ -n "${token}" ]] && break
		fi
	done
fi
if [[ -z "${token}" ]]; then
	echo "Set VERCEL_TOKEN or run vercel login. CLI auth.json paths vary by OS — see https://vercel.com/docs/project-configuration/global-configuration" >&2
	exit 1
fi

team="${VERCEL_TEAM_ID:-worldwadeweb}"
url="https://api.vercel.com/v2/teams/${team}"
json="$(curl -sfS -H "Authorization: Bearer ${token}" "${url}")" || {
	echo "Could not read Vercel team ${team}. Check VERCEL_TEAM_ID or vercel login." >&2
	exit 1
}

export VC_JSON="${json}"
export VC_TOKEN="${token}"
export VC_TEAM="${team}"
node "${script_dir}/verify-vercel-release.mjs"
