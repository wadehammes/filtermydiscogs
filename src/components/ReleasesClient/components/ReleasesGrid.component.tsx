import { ReleaseCard } from "src/components/ReleaseCard/ReleaseCard.component";
import { ReleaseListItem } from "src/components/ReleaseListItem/ReleaseListItem.component";
import { ReleasesTable } from "src/components/ReleasesTable/ReleasesTable.component";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleasesGrid.module.css";

interface ReleasesGridProps {
  releases: DiscogsRelease[];
  view: "card" | "list" | "random";
  isMobile: boolean;
  isRandomMode: boolean;
  highlightedReleaseId: string | null;
  onExitRandomMode: () => void;
}

export const ReleasesGrid = ({
  releases,
  view,
  isMobile,
  isRandomMode,
  highlightedReleaseId,
  onExitRandomMode,
}: ReleasesGridProps) => {
  const isCardView = view === "card" || isMobile || isRandomMode;
  const isListView = view === "list" && !isMobile && !isRandomMode;

  const getGridClassName = () => {
    if (isRandomMode) {
      return styles.releasesGridRandom;
    }
    return isCardView ? styles.releasesGrid : styles.releasesList;
  };

  // Use table component for list view
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
    <div className={getGridClassName()}>
      {releases.map((release: DiscogsRelease) => (
        <div key={release.instance_id} id={`release-${release.instance_id}`}>
          {isCardView ? (
            <ReleaseCard
              release={release}
              isHighlighted={highlightedReleaseId === release.instance_id}
              isRandomMode={isRandomMode}
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
