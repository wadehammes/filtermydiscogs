import dynamic from "next/dynamic";
import { memo, useMemo } from "react";
import { MobileReleaseCard } from "src/components/ReleaseCard/MobileReleaseCard.component";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleaseListItem } from "src/components/ReleaseListItem/ReleaseListItem.component";
import Spinner from "src/components/Spinner/Spinner.component";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleasesGrid.module.css";

const ReleasesTable = dynamic(
  () =>
    import("src/components/ReleasesTable/ReleasesTable.component").then(
      (mod) => mod.ReleasesTable,
    ),
  {
    loading: () => (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" aria-label="Loading table view" />
        <p className={styles.loadingText}>Loading table view...</p>
      </div>
    ),
  },
);

interface ReleasesGridProps {
  releases: DiscogsRelease[];
  view: "card" | "list" | "random";
  isMobile: boolean;
  isRandomMode: boolean;
  onExitRandomMode: () => void;
  randomRelease?: DiscogsRelease | null;
}

const ReleasesGridComponent = ({
  releases,
  view,
  isMobile,
  isRandomMode,
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
        gridTemplateColumns: isMobile
          ? "1fr"
          : "repeat(auto-fill, minmax(280px, 1fr))",
        padding: "0 var(--space-4)",
      };
    }

    return undefined;
  }, [isActuallyRandomMode, isCardView, isMobile]);

  if (isListView) {
    return (
      <ReleasesTable
        releases={releasesToShow}
        isMobile={isMobile}
        isRandomMode={isRandomMode}
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
            isMobile ? (
              <MobileReleaseCard
                release={release}
                isRandomMode={isActuallyRandomMode}
                onExitRandomMode={onExitRandomMode}
              />
            ) : (
              <ReleaseCard
                release={release}
                isRandomMode={isActuallyRandomMode}
                onExitRandomMode={onExitRandomMode}
              />
            )
          ) : (
            <ReleaseListItem
              release={release}
              onExitRandomMode={onExitRandomMode}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export const ReleasesGrid = memo(ReleasesGridComponent);
