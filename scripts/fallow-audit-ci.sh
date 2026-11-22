#!/usr/bin/env bash
set -euo pipefail

# Fallow changed-files audit for CI: print the full report (including worsened
# complexity at error severity). Exit 0 always — findings are advisory on PRs.
# Use `pnpm fallow:audit` locally (`mise run pr-prep`) for the stricter new-only gate.
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

echo "Fallow audit vs ${BASE_REF} (CI: advisory — worsened complexity reported, does not fail the job)"

# Honor .fallowrc audit.worsened: warn — do not pass --worsened error on CI.
pnpm exec fallow audit --changed-since "$BASE_REF" --worsened warn || true

# CLI may exit non-zero when findings exist; JSON is still emitted — do not let set -e skip the gate.
JSON="$(pnpm exec fallow audit --changed-since "$BASE_REF" --worsened warn --format json 2>/dev/null || true)"

export JSON
node <<'NODE'
if (!process.env.JSON?.trim()) {
  console.error("fallow-audit-ci: no JSON from fallow audit — cannot evaluate gate.");
  process.exit(1);
}

const j = JSON.parse(process.env.JSON);
const attr = j.attribution ?? {};

const worsenedOnlyLineCount = (finding) => {
  const metrics = finding.worsened_metrics ?? [];
  return (
    metrics.length > 0 &&
    metrics.every((metric) => metric.metric === "line_count")
  );
};

const worsened = (j.complexity?.findings ?? []).filter(
  (finding) => finding.attribution === "worsened",
);

const blocking = worsened.filter(
  (finding) =>
    finding.effective_severity === "error" &&
    !worsenedOnlyLineCount(finding),
);

const advisory = worsened.filter(
  (finding) =>
    finding.effective_severity !== "error" ||
    worsenedOnlyLineCount(finding),
);

const printWorsened = (list, prefix) => {
  for (const finding of list) {
    console.error(`${prefix} ${finding.path}:${finding.line} ${finding.name}`);
    for (const metric of finding.worsened_metrics ?? []) {
      console.error(`    ${metric.metric}: ${metric.base} -> ${metric.head}`);
    }
  }
};

if (blocking.length > 0) {
  console.error(
    `\nfallow-audit-ci: advisory — ${blocking.length} worsened complexity finding(s) at error severity (excluding line_count-only); job still passes.`,
  );
  printWorsened(blocking, " ");
}

if (advisory.length > 0) {
  console.log(
    `fallow-audit-ci: note — ${advisory.length} worsened finding(s) advisory in CI (warn severity or line_count-only):`,
  );
  printWorsened(advisory, " ");
}

const introduced = attr.complexity_introduced ?? 0;
const inherited = attr.complexity_inherited ?? 0;
console.log(
  `fallow-audit-ci: pass (complexity_worsened=${attr.complexity_worsened ?? 0}; blocking_worsened_reported=${blocking.length}; introduced=${introduced}, inherited=${inherited}).`,
);
NODE