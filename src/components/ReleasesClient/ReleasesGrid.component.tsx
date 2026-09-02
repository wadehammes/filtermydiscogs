import { memo, useMemo } from "react";
import { MobileReleaseCard } from "src/components/ReleaseCard/MobileReleaseCard.component";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleaseListItem } from "src/components/ReleaseListItem/ReleaseListItem.component";
import { ReleasesTable } from "src/components/ReleasesTable/ReleasesTable.component";
import { DiceThinIcon } from "src/styles/icons/DiceThinIcon.component";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleasesGrid.module.css";

interface ReleasesGridProps {
  releases: DiscogsRelease[];
  view: "card" | "list" | "random";
  isMobile: boolean;
  isRandomMode: boolean;
  onExitRandomMode: () => void;
  onRandomClick?: () => void;
  onReleaseClick: (instanceId: string) => void;
  randomRelease?: DiscogsRelease | null;
}

const ReleasesGridComponent = ({
  releases,
  view,
  isMobile,
  isRandomMode,
  onExitRandomMode,
  onRandomClick,
  onReleaseClick,
  randomRelease,
}: ReleasesGridProps) => {
  "use memo";
  const isActuallyRandomMode = isRandomMode && view === "random";
  const isCardView = view === "card" || isActuallyRandomMode;
  const isListView = view === "list" && !isActuallyRandomMode;

  const releasesToShow = isActuallyRandomMode
    ? randomRelease
      ? [randomRelease]
      : []
    : releases;

  const gridClassName = useMemo(() => {
    if (isActuallyRandomMode) {
      return styles.releasesGridRandom;
    }

    return styles.releasesGrid;
  }, [isActuallyRandomMode]);

  const useDesktopCard = !isMobile || isActuallyRandomMode;

  if (isListView) {
    return (
      <ReleasesTable
        releases={releasesToShow}
        onExitRandomMode={onExitRandomMode}
        onReleaseClick={onReleaseClick}
      />
    );
  }

  return (
    <div className={gridClassName} key={`grid-${view}-${isRandomMode}`}>
      {releasesToShow.map((release: DiscogsRelease) => (
        <div
          key={release.instance_id}
          id={`release-${release.instance_id}`}
          className={styles.releaseItem}
        >
          {isCardView ? (
            useDesktopCard ? (
              <ReleaseCard
                release={release}
                isRandomMode={isActuallyRandomMode}
                onExitRandomMode={onExitRandomMode}
                onReleaseClick={onReleaseClick}
              />
            ) : (
              <MobileReleaseCard
                release={release}
                isRandomMode={isActuallyRandomMode}
                onExitRandomMode={onExitRandomMode}
                onReleaseClick={onReleaseClick}
              />
            )
          ) : (
            <ReleaseListItem
              release={release}
              onExitRandomMode={onExitRandomMode}
              onReleaseClick={onReleaseClick}
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
            <DiceThinIcon width="16" height="16" />
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
      prevProps.onRandomClick === nextProps.onRandomClick &&
      prevProps.onReleaseClick === nextProps.onReleaseClick
    );
  },
);
