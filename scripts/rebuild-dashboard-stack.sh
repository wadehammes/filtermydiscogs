#!/usr/bin/env bash
# Rebuild dashboard stack: one commit per branch on top of 11-26-fix-speed-insights.
# Final tree on 11-26-dashboard-year-review must match DASHBOARD_FINAL_SHA.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE_SHA="${DASHBOARD_BASE_SHA:-5906a8f38689f696813433de465b3b4dd969a9da}"
FINAL_SHA="${DASHBOARD_FINAL_SHA:-b4b971e2953f3709af2be492be8fe645821a80b6}"
COMMIT="${ROOT}/scripts/git-commit.sh"

co() {
  git checkout "$FINAL_SHA" -- "$@"
}

commit_layer() {
  local msg="$1"
  shift
  if git diff --cached --quiet; then
  git add "$@"
  fi
  if ! git diff --cached --quiet; then
    "$COMMIT" -m "$msg"
  fi
}

mk_cwv_dashboard_client() {
  git show "$BASE_SHA:src/components/Dashboard/DashboardClient.component.tsx" \
    >src/components/Dashboard/DashboardClient.component.tsx
  mise exec python@3.11.13 -- python3 - <<'PY'
from pathlib import Path

path = Path("src/components/Dashboard/DashboardClient.component.tsx")
text = path.read_text()

needle_import = "import { useCollectionLoadState } from \"src/hooks/useCollectionData.hook\";\n"
insert_import = needle_import + (
    "import { usePaintDeferredMount } from \"src/hooks/usePaintDeferredMount.hook\";\n"
)
if "usePaintDeferredMount" not in text:
    text = text.replace(needle_import, insert_import)

needle_effect = "  }, [valueError]);\n\n  if (shouldRedirectHome) {"
insert_vars = (
    "  }, [valueError]);\n\n"
    "  const dashboardContentReady =\n"
    "    !fetchingCollection && analytics !== null && story !== null;\n"
    "  const mountBelowFold = usePaintDeferredMount(dashboardContentReady);\n\n"
    "  if (shouldRedirectHome) {"
)
if "dashboardContentReady" not in text:
    text = text.replace(needle_effect, insert_vars)

text = text.replace(
    "{!fetchingCollection && analytics && story && (",
    "{dashboardContentReady && story && analytics && (",
)

start = "              <DashboardSection\n                lede={story.sections.growth.lede}"
end = "                    </div>\n              </DashboardSection>"
# Locate block from growth section through end of shelf check pair - wrap in belowFold
growth_marker = "              <DashboardSection\n                lede={story.sections.growth.lede}"
idx = text.find(growth_marker)
if idx == -1:
    raise SystemExit("growth section not found")
# Find closing of content div before ``            </div>`` that closes .content - use last storyPair for upkeep
upkeep_end = "                  </DashboardSection>\n                    </div>\n              </DashboardSection>"
idx_end = text.rfind(
    "                      <CollectionHealth\n                          health={analytics.health}"
)
if idx_end == -1:
    raise SystemExit("CollectionHealth not found")
# find closing tags after CollectionHealth section
close = text.find("            </div>\n          )}", idx_end)
if close == -1:
    raise SystemExit("content close not found")
block = text[idx:close].rstrip()
wrapped = (
    "              <div className={styles.belowFold} aria-busy={!mountBelowFold}>\n"
    "                {mountBelowFold && (\n"
    "                  <>\n"
    + "\n".join("                    " + line if line else "" for line in block.splitlines())
    + "\n                  </>\n"
    "                )}\n"
    "              </div>\n"
)
text = text[:idx] + wrapped + text[close:]
path.write_text(text)
PY
}

echo "Rebuilding dashboard stack (base=$BASE_SHA final=$FINAL_SHA)"

git checkout 11-26-fix-speed-insights
git checkout -B 11-26-dashboard-revisit "$BASE_SHA"

co docs/plans/dashboard-revisit-stack.md
git add docs/plans/dashboard-revisit-stack.md
"$COMMIT" -m "$(cat <<'EOF'
Document dashboard revisit stack layers and goals.
EOF
)"

git checkout -B 11-26-dashboard-cwv
co src/hooks/usePaintDeferredMount.hook.ts \
  src/hooks/usePaintDeferredMount.hook.spec.ts \
  src/hooks/useMosaicGridIdleMount.hook.ts \
  src/components/Dashboard/DashboardClient.module.css
mk_cwv_dashboard_client
git add \
  src/hooks/usePaintDeferredMount.hook.ts \
  src/hooks/usePaintDeferredMount.hook.spec.ts \
  src/hooks/useMosaicGridIdleMount.hook.ts \
  src/components/Dashboard/DashboardClient.module.css \
  src/components/Dashboard/DashboardClient.component.tsx
"$COMMIT" -m "$(cat <<'EOF'
Defer below-fold dashboard sections until after first paint.

Add usePaintDeferredMount, wrap growth-through-shelf in aria-busy belowFold,
and share the mosaic idle-mount pattern via useMosaicGridIdleMount.
EOF
)"

git checkout -B 11-26-dashboard-drilldown
co \
  src/hooks/useDashboardCollectionDrilldown.hook.ts \
  src/hooks/useDashboardCollectionDrilldown.hook.spec.ts \
  src/utils/dashboardDrilldownFilters.ts \
  src/utils/dashboardDrilldownFilters.spec.ts \
  src/utils/dashboardDrilldownCopy.ts \
  src/utils/dashboardDrilldownCopy.spec.ts \
  src/utils/collectionAnalytics.ts \
  src/utils/collectionAnalytics.spec.ts \
  src/utils/releaseFilterMatchers.ts \
  src/utils/releaseFilterMatchers.spec.ts \
  src/utils/filterReleases.spec.ts \
  src/utils/tanstackCharts.ts \
  src/styles/modules/dashboard-drilldown.module.css \
  src/constants/dashboardCopy.constants.ts \
  src/components/Dashboard/DashboardBarDrilldownHint.component.tsx \
  src/components/Dashboard/DashboardDrilldownFacetControl.component.tsx \
  src/components/Dashboard/ArtistLabelCharts.component.tsx \
  src/components/Dashboard/ArtistLabelCharts.module.css \
  src/components/Dashboard/DistributionCharts.component.tsx \
  src/components/Dashboard/DistributionCharts.module.css \
  src/components/Dashboard/DuplicatesList.component.tsx \
  src/components/Dashboard/DuplicatesList.module.css \
  src/components/Dashboard/DuplicatesDetailModal.component.tsx \
  src/components/Dashboard/MostCrated.component.tsx \
  src/components/Dashboard/MostCrated.module.css \
  src/components/Dashboard/CollectionHealth.component.tsx \
  src/components/FiltersDrawer/FiltersDrawer.component.tsx \
  src/components/PieChartLegend/PieChartLegend.component.tsx \
  src/components/PieChartLegend/PieChartLegend.module.css \
  src/components/TanstackChart/TanstackChart.component.tsx \
  src/components/TanstackChart/TanstackChart.module.css \
  src/components/Dashboard/DashboardClient.component.tsx
git add -A
"$COMMIT" -m "$(cat <<'EOF'
Dashboard chart and duplicate drill-down to collection filters.

Wire bar and pie facets through useDashboardCollectionDrilldown, canonical
style labels, case-insensitive matchers, FiltersDrawer lazy mount, and chart UX.
EOF
)"

git checkout -B 11-26-dashboard-freshness
co \
  src/hooks/useCollectionLastSyncedLabel.hook.ts \
  src/hooks/useCollectionLastSyncedLabel.hook.spec.ts \
  src/utils/formatCollectionLastSyncedLabel.ts \
  src/utils/formatCollectionLastSyncedLabel.spec.ts \
  src/utils/getDashboardSegmentErrorContent.ts \
  src/utils/getDashboardSegmentErrorContent.spec.ts \
  src/components/Dashboard/DashboardCollectionFreshness.component.tsx \
  src/components/Dashboard/DashboardCollectionFreshness.module.css \
  src/components/Dashboard/DashboardCollectionFreshness.spec.tsx \
  src/components/Dashboard/DashboardSegmentError.component.tsx \
  src/components/Dashboard/DashboardSegmentError.module.css \
  src/components/Dashboard/DashboardSegmentError.spec.tsx \
  src/components/Dashboard/DashboardHero.component.tsx \
  src/components/Dashboard/DashboardHero.spec.tsx \
  src/components/Dashboard/TopTracks.component.tsx \
  src/components/Dashboard/DashboardClient.component.tsx
git add -A
"$COMMIT" -m "$(cat <<'EOF'
Dashboard trust UX: last synced and segment outage copy.

Surface collection freshness under the hero and reuse collection load error
semantics for value and On repeat when Discogs is throttling or down.
EOF
)"

git checkout -B 11-26-dashboard-tests
co \
  e2e/authenticated-dashboard.spec.ts \
  src/components/Dashboard/CollectionHealth.po.tsx \
  src/components/Dashboard/CollectionHealth.spec.tsx \
  src/components/Dashboard/DashboardClient.po.tsx \
  src/components/Dashboard/DashboardClient.spec.tsx \
  src/tests/msw/createAuthenticatedE2eHandlers.ts \
  src/tests/msw/e2eCollectionData.ts \
  docs/handbook/components.md \
  docs/handbook/patterns.md
git add -A
"$COMMIT" -m "$(cat <<'EOF'
Dashboard tests, E2E handlers, and handbook sync.
EOF
)"

git checkout -B 11-26-dashboard-year-review
co \
  src/utils/collectionRecapShare.ts \
  src/utils/collectionRecapShare.spec.ts \
  src/utils/dashboardStory.ts \
  src/utils/dashboardStory.spec.ts \
  src/components/Dashboard/CollectionRhythm.component.tsx \
  src/components/Dashboard/CollectionRhythm.module.css
git add -A
"$COMMIT" -m "$(cat <<'EOF'
Copy collection recap share from the dashboard rhythm card.
EOF
)"

if ! git diff --quiet "$FINAL_SHA"; then
  echo "ERROR: year-review tip does not match final snapshot" >&2
  git diff --stat "$FINAL_SHA"
  exit 1
fi

echo "OK: stack tips match $FINAL_SHA"