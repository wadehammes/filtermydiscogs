import dynamic from "next/dynamic";
import { memo, useMemo } from "react";
import { MobileReleaseCard } from "src/components/ReleaseCard/MobileReleaseCard.component";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleaseListItem } from "src/components/ReleaseListItem/ReleaseListItem.component";
import Spinner from "src/components/Spinner/Spinner.component";
import DiceSolid from "src/styles/icons/dice-solid.svg";
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
  onRandomClick?: () => void;
  randomRelease?: DiscogsRelease | null;
}

const ReleasesGridComponent = ({
  releases,
  view,
  isMobile,
  isRandomMode,
  onExitRandomMode,
  onRandomClick,
  randomRelease,
}: ReleasesGridProps) => {
  const isActuallyRandomMode = isRandomMode && view === "random";
  const isCardView = view === "card" || isMobile || isActuallyRandomMode;
  const isListView = view === "list" && !isMobile && !isActuallyRandomMode;

  const releasesToShow = isActuallyRandomMode
    ? randomRelease
      ? [randomRelease]
      : []
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
  }, [isCardView, isActuallyRandomMode, isMobile]);

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
      {isMobile && isRandomMode && onRandomClick && (
        <div className={styles.randomButtonContainer}>
          <button
            type="button"
            className={styles.randomButton}
            onClick={onRandomClick}
            aria-label="Get another random release"
          >
            <DiceSolid width="16" height="16" />
            <span>Get Another Random Release</span>
          </button>
          <button
            type="button"
            className={styles.exitRandomLink}
            onClick={onExitRandomMode}
            aria-label="Exit random mode"
          >
            Exit random mode
          </button>
        </div>
      )}
    </div>
  );
};

export const ReleasesGrid = memo(
  ReleasesGridComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.releases === nextProps.releases &&
      prevProps.view === nextProps.view &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.isRandomMode === nextProps.isRandomMode &&
      prevProps.randomRelease === nextProps.randomRelease &&
      prevProps.onExitRandomMode === nextProps.onExitRandomMode &&
      prevProps.onRandomClick === nextProps.onRandomClick
    );
  },
);
