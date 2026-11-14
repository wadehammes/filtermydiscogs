#!/usr/bin/env bash
set -euo pipefail

# Fallow changed-files audit for CI: print the full report, but exit 1 only when a
# *worsened* complexity finding would gate like `--worsened error` (effective_severity
# error). Metric growth at warn severity (e.g. line_count on an already-CRAP function)
# is reported but does not fail CI. Introduced findings are advisory in CI; use
# `pnpm fallow:audit` locally for the new-only gate (pr-prep).
#
# Usage: bash scripts/fallow-audit-ci.sh [base-ref]
# Default base: origin/staging

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_REF="${1:-origin/staging}"

if ! git rev-parse --verify "${BASE_REF}^{commit}" >/dev/null 2>&1; then
  echo "fallow-audit-ci: base ref '${BASE_REF}' not found (fetch remotes first)." >&2
  exit 1
fi

echo "Fallow audit vs ${BASE_REF} (CI gate: worsened complexity at error severity only)"

# Human-readable report (introduced verdict ignored; --worsened error matches gating semantics).
pnpm exec fallow audit --changed-since "$BASE_REF" --worsened error || true

JSON="$(pnpm exec fallow audit --changed-since "$BASE_REF" --worsened error --format json 2>/dev/null)"

export JSON
node <<'NODE'
const j = JSON.parse(process.env.JSON);
const attr = j.attribution ?? {};
const worsened = (j.complexity?.findings ?? []).filter(
  (f) => f.attribution === "worsened",
);
const blocking = worsened.filter((f) => f.effective_severity === "error");
const advisory = worsened.filter((f) => f.effective_severity !== "error");

const printWorsened = (list, prefix) => {
  for (const f of list) {
    console.error(`${prefix} ${f.path}:${f.line} ${f.name}`);
    for (const m of f.worsened_metrics ?? []) {
      console.error(`    ${m.metric}: ${m.base} -> ${m.head}`);
    }
  }
};

if (blocking.length > 0) {
  console.error(
    `\nfallow-audit-ci: FAIL — ${blocking.length} worsened complexity finding(s) at error severity.`,
  );
  printWorsened(blocking, " ");
  process.exit(1);
}

if (advisory.length > 0) {
  console.log(
    `fallow-audit-ci: note — ${advisory.length} worsened finding(s) at warn severity (advisory in CI):`,
  );
  printWorsened(advisory, " ");
}

const introduced = attr.complexity_introduced ?? 0;
const inherited = attr.complexity_inherited ?? 0;
console.log(
  `fallow-audit-ci: pass (blocking worsened=0; complexity_worsened=${attr.complexity_worsened ?? 0}; introduced=${introduced}, inherited=${inherited} — advisory in CI).`,
);
NODE