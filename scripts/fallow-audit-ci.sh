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

echo "Fallow audit vs ${BASE_REF} (CI: advisory — complexity + architecture on changed files; does not fail the job)"

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

const ARCHITECTURE_ISSUE_TYPES = new Set([
  "boundary-violation",
  "boundary-coverage-violation",
  "boundary-call-violation",
  "policy-violation",
  "circular-dependency",
  "re-export-cycle",
  "package-cycle",
]);

const isIntroduced = (finding) =>
  finding.attribution === "introduced" || finding.introduced === true;

const deadFindings = j.dead_code?.findings ?? [];
const archIntroduced = deadFindings.filter(
  (finding) =>
    ARCHITECTURE_ISSUE_TYPES.has(finding.issue_type) && isIntroduced(finding),
);
const archInherited = deadFindings.filter(
  (finding) =>
    ARCHITECTURE_ISSUE_TYPES.has(finding.issue_type) &&
    !isIntroduced(finding),
);

const deadSummary = j.dead_code?.summary ?? {};
const archScopeTotals = {
  boundary: deadSummary.boundary_violations ?? 0,
  boundary_call: deadSummary.boundary_call_violations ?? 0,
  boundary_coverage: deadSummary.boundary_coverage_violations ?? 0,
  policy: deadSummary.policy_violations ?? 0,
  circular: deadSummary.circular_dependencies ?? 0,
  re_export: deadSummary.re_export_cycles ?? 0,
  package: deadSummary.package_cycles ?? 0,
};

const printArchFinding = (finding) => {
  const label =
    finding.from_zone && finding.to_zone
      ? `${finding.from_zone} -> ${finding.to_zone}`
      : (finding.name ?? finding.issue_type);
  const line = finding.line != null ? `:${finding.line}` : "";
  console.log(
    `  ${finding.issue_type} ${finding.path}${line} ${label}`.trimEnd(),
  );
  if (finding.message) {
    console.log(`    ${finding.message}`);
  }
};

if (
  archScopeTotals.boundary +
    archScopeTotals.boundary_call +
    archScopeTotals.boundary_coverage +
    archScopeTotals.policy +
    archScopeTotals.circular +
    archScopeTotals.re_export +
    archScopeTotals.package >
  0
) {
  console.log(
    "fallow-audit-ci: architecture in changed scope (audit dead-code pass):",
    `boundary=${archScopeTotals.boundary}`,
    `boundary_call=${archScopeTotals.boundary_call}`,
    `boundary_coverage=${archScopeTotals.boundary_coverage}`,
    `policy=${archScopeTotals.policy}`,
    `circular=${archScopeTotals.circular}`,
    `re_export_cycle=${archScopeTotals.re_export}`,
    `package_cycle=${archScopeTotals.package}`,
  );
}

if (archIntroduced.length > 0) {
  console.error(
    `\nfallow-audit-ci: advisory — ${archIntroduced.length} introduced architecture finding(s) on changed files; job still passes.`,
  );
  for (const finding of archIntroduced) {
    printArchFinding(finding);
  }
} else if (archInherited.length > 0) {
  console.log(
    `fallow-audit-ci: note — ${archInherited.length} inherited architecture finding(s) on touched files (new-only gate would not block).`,
  );
}

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
  `fallow-audit-ci: pass (architecture_introduced=${archIntroduced.length}; architecture_inherited=${archInherited.length}; complexity_worsened=${attr.complexity_worsened ?? 0}; blocking_worsened_reported=${blocking.length}; complexity_introduced=${introduced}; complexity_inherited=${inherited}).`,
);
NODE