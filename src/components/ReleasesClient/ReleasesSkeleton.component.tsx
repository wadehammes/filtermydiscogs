import { DesktopReleaseCardSkeleton } from "./DesktopReleaseCardSkeleton.component";
import { MobileReleaseCardSkeleton } from "./MobileReleaseCardSkeleton.component";
import gridStyles from "./ReleasesGrid.module.css";
import styles from "./ReleasesSkeleton.module.css";

const SKELETON_CARD_COUNT = 12;

interface ReleasesSkeletonProps {
  isMobile?: boolean;
}

export function ReleasesSkeleton({ isMobile = false }: ReleasesSkeletonProps) {
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
}
