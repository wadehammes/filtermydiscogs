import type { ViewMode } from "src/types/view.types";
import { DesktopReleaseCardSkeleton } from "./DesktopReleaseCardSkeleton.component";
import { MobileReleaseCardSkeleton } from "./MobileReleaseCardSkeleton.component";
import gridStyles from "./ReleasesGrid.module.css";
import styles from "./ReleasesSkeleton.module.css";
import { ReleasesTableSkeleton } from "./ReleasesTableSkeleton.component";

const SKELETON_CARD_COUNT = 15;

interface ReleasesSkeletonProps {
  isMobile?: boolean;
  view?: ViewMode;
}

export const ReleasesSkeleton = ({
  isMobile = false,
  view = "card",
}: ReleasesSkeletonProps) => {
  if (view === "list" && !isMobile) {
    return (
      <div className={styles.root} data-testid="fmdReleasesSkeleton">
        <ReleasesTableSkeleton />
      </div>
    );
  }

  const SkeletonCard = isMobile
    ? MobileReleaseCardSkeleton
    : DesktopReleaseCardSkeleton;

  return (
    <div className={styles.root} data-testid="fmdReleasesSkeleton">
      <div className={gridStyles.releasesGrid}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
          <div key={index} className={gridStyles.releaseItem}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
};
