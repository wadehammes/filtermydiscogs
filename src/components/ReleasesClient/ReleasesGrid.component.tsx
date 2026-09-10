import { type CSSProperties, memo, useMemo } from "react";
import { MobileReleaseCard } from "src/components/ReleaseCard/MobileReleaseCard.component";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleaseListItem } from "src/components/ReleaseListItem/ReleaseListItem.component";
import { ReleasesTable } from "src/components/ReleasesTable/ReleasesTable.component";
import { useCrateState } from "src/context/crate.context";
import { DiceThinIcon } from "src/styles/icons/DiceThinIcon.component";
import textActionStyles from "src/styles/modules/text-action.module.css";
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
  const { activeCrateInstanceIds } = useCrateState();
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

  const useFixedLanes = useMemo(() => {
    if (isMobile || isActuallyRandomMode) {
      return false;
    }

    const count = releasesToShow.length;
    return count >= 2 && count <= 4;
  }, [isActuallyRandomMode, isMobile, releasesToShow.length]);

  if (isListView) {
    return (
      <ReleasesTable
        releases={releasesToShow}
        onExitRandomMode={onExitRandomMode}
        onReleaseClick={onReleaseClick}
      />
    );
  }

  const fixedLaneStyle: CSSProperties | undefined = useFixedLanes
    ? ({ "--grid-lane-count": releasesToShow.length } as CSSProperties)
    : undefined;

  return (
    <div
      className={gridClassName}
      key={`grid-${view}-${isRandomMode}`}
      data-fixed-lanes={useFixedLanes ? "" : undefined}
      style={fixedLaneStyle}
    >
      {releasesToShow.map((release: DiscogsRelease, index) => {
        const inActiveCrate = activeCrateInstanceIds.has(
          String(release.instance_id),
        );
        const imagePriority = index === 0;

        return (
          <div
            key={release.instance_id}
            id={`release-${release.instance_id}`}
            className={styles.releaseItem}
          >
            {isCardView ? (
              useDesktopCard ? (
                <ReleaseCard
                  release={release}
                  inActiveCrate={inActiveCrate}
                  isRandomMode={isActuallyRandomMode}
                  onExitRandomMode={onExitRandomMode}
                  onReleaseClick={onReleaseClick}
                  priority={imagePriority}
                />
              ) : (
                <MobileReleaseCard
                  release={release}
                  inActiveCrate={inActiveCrate}
                  isRandomMode={isActuallyRandomMode}
                  onExitRandomMode={onExitRandomMode}
                  onReleaseClick={onReleaseClick}
                  priority={imagePriority}
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
        );
      })}
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
            className={textActionStyles.muted}
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
