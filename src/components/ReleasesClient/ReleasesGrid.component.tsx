import { type CSSProperties, memo, useMemo, useRef } from "react";
import { usePlaybackPageScrollElement } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { MobileReleaseCard } from "src/components/ReleaseCard/MobileReleaseCard.component";
import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleasesTable } from "src/components/ReleasesTable/ReleasesTable.component";
import { useRegisterPlaybackPageScrollToTop } from "src/hooks/useRegisterPlaybackPageScrollToTop.hook";
import { useVirtualizedReleaseGrid } from "src/hooks/useVirtualizedReleaseGrid.hook";
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

interface ReleaseGridCardProps {
  release: DiscogsRelease;
  isActuallyRandomMode: boolean;
  useDesktopCard: boolean;
  onExitRandomMode: () => void;
  onReleaseClick: (instanceId: string) => void;
}

const ReleaseGridCard = ({
  release,
  isActuallyRandomMode,
  useDesktopCard,
  onExitRandomMode,
  onReleaseClick,
}: ReleaseGridCardProps) => {
  return (
    <div id={`release-${release.instance_id}`} className={styles.releaseItem}>
      {useDesktopCard ? (
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
      )}
    </div>
  );
};

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
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const scrollElement = usePlaybackPageScrollElement();
  const isActuallyRandomMode = isRandomMode && view === "random";
  const isListView = view === "list" && !isActuallyRandomMode;

  const releasesToShow = isActuallyRandomMode
    ? randomRelease
      ? [randomRelease]
      : []
    : releases;

  const gridClassName = isActuallyRandomMode
    ? styles.releasesGridRandom
    : styles.releasesGrid;

  const useDesktopCard = !isMobile || isActuallyRandomMode;
  const forceSingleColumn = isMobile && !isActuallyRandomMode;

  const {
    columnCount,
    estimatedRowStride,
    initialFallbackRows,
    rowCount,
    rowVirtualizer,
    useVirtualRows,
    virtualRows,
  } = useVirtualizedReleaseGrid({
    releaseCount: releasesToShow.length,
    scrollElement,
    gridContainerRef,
    forceSingleColumn,
    enabled: !isListView,
  });

  useRegisterPlaybackPageScrollToTop(
    rowVirtualizer,
    useVirtualRows && !isActuallyRandomMode,
  );

  const virtualRowsToRender = useMemo(() => {
    if (virtualRows.length > 0) {
      return virtualRows;
    }

    const fallbackRowCount = Math.min(initialFallbackRows, rowCount);

    return Array.from({ length: fallbackRowCount }, (_, index) => ({
      index,
      key: `fallback-row-${index}`,
      start: index * estimatedRowStride,
    }));
  }, [estimatedRowStride, initialFallbackRows, rowCount, virtualRows]);

  if (isListView) {
    return (
      <ReleasesTable
        releases={releasesToShow}
        onExitRandomMode={onExitRandomMode}
        onReleaseClick={onReleaseClick}
      />
    );
  }

  const renderCard = (release: DiscogsRelease) => (
    <ReleaseGridCard
      key={release.instance_id}
      release={release}
      isActuallyRandomMode={isActuallyRandomMode}
      useDesktopCard={useDesktopCard}
      onExitRandomMode={onExitRandomMode}
      onReleaseClick={onReleaseClick}
    />
  );

  if (useVirtualRows && !isActuallyRandomMode) {
    return (
      <div
        ref={gridContainerRef}
        className={styles.virtualGridContainer}
        key={`grid-${view}-${isRandomMode}`}
      >
        <div
          className={styles.virtualGridInner}
          style={{ height: rowVirtualizer.getTotalSize() }}
        >
          {virtualRowsToRender.map((virtualRow) => {
            const rowIndex = virtualRow.index;
            const startIndex = rowIndex * columnCount;
            const rowReleases = releasesToShow.slice(
              startIndex,
              startIndex + columnCount,
            );
            const isMeasuredRow = virtualRows.length > 0;

            return (
              <div
                key={virtualRow.key}
                ref={isMeasuredRow ? rowVirtualizer.measureElement : undefined}
                className={styles.virtualRow}
                data-index={virtualRow.index}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className={styles.virtualRowGrid}
                  style={
                    {
                      "--virtual-grid-columns": columnCount,
                    } as CSSProperties
                  }
                >
                  {rowReleases.map(renderCard)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={gridContainerRef}
      className={gridClassName}
      key={`grid-${view}-${isRandomMode}`}
    >
      {releasesToShow.map(renderCard)}
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
