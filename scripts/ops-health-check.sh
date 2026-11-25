#!/usr/bin/env bash
# Ops health snapshot: Dependabot, pnpm audit, lockfile deprecation markers, peer drift.
# Sentry production triage is agent-driven (Sentry MCP) — see .cursor/skills/ops-health-check/SKILL.md
#
# Usage:
#   bash scripts/ops-health-check.sh           # human-readable report; exit 1 on high/critical findings
#   bash scripts/ops-health-check.sh --strict  # same; also exit 1 on moderate pnpm audit
#   bash scripts/ops-health-check.sh --json    # machine-readable summary (stdout only)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STRICT=0
JSON=0
for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=1 ;;
    --json) JSON=1 ;;
    -h | --help)
      sed -n '2,8p' "$0"
      exit 0
      ;;
    *)
      echo "ops-health-check: unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

GITHUB_REPO="${GITHUB_REPOSITORY:-}"
if [[ -z "$GITHUB_REPO" ]]; then
  GITHUB_REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
fi

DEPENDABOT_JSON="[]"
DEPENDABOT_ERR=""
if [[ -n "$GITHUB_REPO" ]]; then
  if DEPENDABOT_JSON="$(gh api "repos/${GITHUB_REPO}/dependabot/alerts?state=open&per_page=100" 2>&1)"; then
    :
  else
    DEPENDABOT_ERR="$DEPENDABOT_JSON"
    DEPENDABOT_JSON="[]"
  fi
else
  DEPENDABOT_ERR="gh repo view failed (not a git repo or gh not authenticated)"
fi

PNPM_AUDIT_FILE="$(mktemp)"
pnpm audit >"$PNPM_AUDIT_FILE" 2>&1 || true
PNPM_AUDIT_EXIT=$?

LOCKFILE_DEPRECATED=0
if [[ -f pnpm-lock.yaml ]]; then
  LOCKFILE_DEPRECATED="$(rg -c '^    deprecated:' pnpm-lock.yaml 2>/dev/null || echo 0)"
fi

PEERS_FILE="$(mktemp)"
pnpm peers check >"$PEERS_FILE" 2>&1 || true

HIGH_CRITICAL=0
if [[ "$DEPENDABOT_JSON" != "[]" && -n "$DEPENDABOT_JSON" ]]; then
  HIGH_CRITICAL="$(printf '%s' "$DEPENDABOT_JSON" | jq '[.[] | select(.security_vulnerability.severity == "high" or .security_vulnerability.severity == "critical")] | length')"
fi

if [[ "$JSON" -eq 1 ]]; then
  jq -n \
    --arg repo "$GITHUB_REPO" \
    --argjson dependabot "$(printf '%s' "$DEPENDABOT_JSON" | jq 'if type == "array" then . else [] end' 2>/dev/null || echo '[]')" \
    --arg dependabot_err "$DEPENDABOT_ERR" \
    --arg audit "$(cat "$PNPM_AUDIT_FILE")" \
    --argjson audit_exit "$PNPM_AUDIT_EXIT" \
    --argjson lockfile_deprecated "$LOCKFILE_DEPRECATED" \
    --arg peers "$(cat "$PEERS_FILE")" \
    --argjson high_critical "$HIGH_CRITICAL" \
    '{
      github_repo: $repo,
      dependabot_open: ($dependabot | length),
      dependabot_high_or_critical: $high_critical,
      dependabot_alerts: ($dependabot | map({
        number,
        severity: .security_vulnerability.severity,
        package: .security_vulnerability.package.name,
        patched: .security_vulnerability.first_patched_version.identifier,
        ghsa: .security_advisory.ghsa_id,
        html_url
      })),
      dependabot_error: (if $dependabot_err == "" then null else $dependabot_err end),
      pnpm_audit_exit: $audit_exit,
      pnpm_audit: $audit,
      lockfile_deprecated_package_count: $lockfile_deprecated,
      pnpm_peers_check: $peers
    }'
  rm -f "$PNPM_AUDIT_FILE" "$PEERS_FILE"
  if [[ "$HIGH_CRITICAL" -gt 0 ]]; then
    exit 1
  fi
  if [[ "$PNPM_AUDIT_EXIT" -ne 0 ]]; then
    exit 1
  fi
  exit 0
fi

echo "=== Ops health check ($(date -u +%Y-%m-%dT%H:%M:%SZ)) ==="
echo "Repo: ${GITHUB_REPO:-unknown}"
echo

echo "--- GitHub Dependabot (open) ---"
if [[ -n "$DEPENDABOT_ERR" ]]; then
  echo "WARN: Could not list alerts: $DEPENDABOT_ERR"
elif [[ "$DEPENDABOT_JSON" == "[]" ]]; then
  echo "None open."
else
  printf '%s' "$DEPENDABOT_JSON" | jq -r '.[] | "#\(.number) \(.security_vulnerability.severity) \(.security_vulnerability.package.name) → patch \(.security_vulnerability.first_patched_version.identifier) (\(.security_advisory.ghsa_id)) \(.html_url)"'
fi
echo

echo "--- pnpm audit ---"
cat "$PNPM_AUDIT_FILE"
echo

echo "--- pnpm-lock.yaml deprecated markers ---"
echo "Count: $LOCKFILE_DEPRECATED (transitive npm deprecation notices; see pnpm why <pkg>)"
if [[ "$LOCKFILE_DEPRECATED" -gt 0 ]]; then
  rg '^  [^ ]+@' pnpm-lock.yaml -B 0 2>/dev/null | head -1 || true
  rg -B 3 '^    deprecated:' pnpm-lock.yaml 2>/dev/null | head -20 || true
fi
echo

echo "--- pnpm peers check (informational) ---"
cat "$PEERS_FILE"
echo

echo "--- Agent next steps (not run by this script) ---"
echo "• Sentry MCP: search_issues — is:unresolved environment:production (see .cursor/skills/sentry/SKILL.md)"
echo "• Local merge gate: mise run pr-prep"
echo "• Full workflow: .cursor/skills/ops-health-check/SKILL.md"
echo

rm -f "$PNPM_AUDIT_FILE" "$PEERS_FILE"

EXIT=0
if [[ "$HIGH_CRITICAL" -gt 0 ]]; then
  EXIT=1
fi
if [[ "$PNPM_AUDIT_EXIT" -ne 0 ]]; then
  EXIT=1
fi
if [[ "$STRICT" -eq 1 && "$PNPM_AUDIT_EXIT" -ne 0 ]]; then
  EXIT=1
fi

if [[ "$EXIT" -eq 0 ]]; then
  echo "Result: PASS (no open high/critical Dependabot; pnpm audit clean)"
else
  echo "Result: ACTION NEEDED (see Dependabot / pnpm audit above)"
fi

exit "$EXIT"