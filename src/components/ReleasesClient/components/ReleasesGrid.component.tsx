import dynamic from "next/dynamic";
import { useMemo } from "react";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleaseListItem } from "src/components/ReleaseListItem/ReleaseListItem.component";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleasesGrid.module.css";

const ReleasesTable = dynamic(
  () =>
    import("src/components/ReleasesTable/ReleasesTable.component").then(
      (mod) => mod.ReleasesTable,
    ),
  {
    loading: () => (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading table view...</p>
      </div>
    ),
  },
);

interface ReleasesGridProps {
  releases: DiscogsRelease[];
  view: "card" | "list" | "random";
  isMobile: boolean;
  isRandomMode: boolean;
  highlightedReleaseId: string | null;
  onExitRandomMode: () => void;
  randomRelease?: DiscogsRelease | null;
}

export const ReleasesGrid = ({
  releases,
  view,
  isMobile,
  isRandomMode,
  highlightedReleaseId,
  onExitRandomMode,
  randomRelease,
}: ReleasesGridProps) => {
  const isActuallyRandomMode = isRandomMode && view === "random";
  const isCardView = view === "card" || isMobile || isActuallyRandomMode;
  const isListView = view === "list" && !isMobile && !isActuallyRandomMode;

  const releasesToShow =
    isActuallyRandomMode && randomRelease
      ? [randomRelease]
      : isActuallyRandomMode && releases.length > 1
        ? releases.slice(0, 1)
        : releases;

  const gridClassName = useMemo(() => {
    if (isActuallyRandomMode) {
      return styles.releasesGridRandom;
    }
    if (isCardView) {
      return styles.releasesGrid;
    }
    return styles.releasesList;
  }, [isActuallyRandomMode, isCardView]);

  const gridStyle = useMemo(() => {
    if (isActuallyRandomMode) {
      return undefined;
    }

    if (isCardView) {
      return {
        display: "grid",
        gap: "var(--space-4)",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        padding: "0 var(--space-4)",
      };
    }

    return undefined;
  }, [isActuallyRandomMode, isCardView]);

  if (isListView) {
    return (
      <ReleasesTable
        releases={releases}
        isMobile={isMobile}
        isRandomMode={isRandomMode}
        highlightedReleaseId={highlightedReleaseId}
        onExitRandomMode={onExitRandomMode}
      />
    );
  }

  return (
    <div
      className={gridClassName}
      style={gridStyle}
      key={`grid-${view}-${isRandomMode}`}
    >
      {releasesToShow.map((release: DiscogsRelease) => (
        <div key={release.instance_id} id={`release-${release.instance_id}`}>
          {isCardView ? (
            <ReleaseCard
              release={release}
              isHighlighted={highlightedReleaseId === release.instance_id}
              isRandomMode={isActuallyRandomMode}
              onExitRandomMode={onExitRandomMode}
            />
          ) : (
            <ReleaseListItem
              release={release}
              isHighlighted={highlightedReleaseId === release.instance_id}
              onExitRandomMode={onExitRandomMode}
            />
          )}
        </div>
      ))}
    </div>
  );
};
