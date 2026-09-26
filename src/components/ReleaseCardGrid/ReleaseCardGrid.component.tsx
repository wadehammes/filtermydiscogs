import { memo } from "react";
import { PublicMobileReleaseCard } from "src/components/ReleaseCard/PublicMobileReleaseCard.component";
import { PublicReleaseCard } from "src/components/ReleaseCard/PublicReleaseCard.component";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseCardGrid.module.css";

interface ReleaseCardGridProps {
  releases: DiscogsRelease[];
  onReleaseClick?: (instanceId: string) => void;
}

const ReleaseCardGridComponent = ({
  releases,
  onReleaseClick,
}: ReleaseCardGridProps) => {
  "use memo";

  return (
    <div className={styles.releasesGrid}>
      {releases.map((release: DiscogsRelease) => (
        <div
          key={release.instance_id}
          id={`release-${release.instance_id}`}
          className={styles.cardSlot}
        >
          <div className={styles.mobileCard}>
            <PublicMobileReleaseCard
              release={release}
              {...definedProps({ onReleaseClick })}
            />
          </div>
          <div className={styles.desktopCard}>
            <PublicReleaseCard
              release={release}
              {...definedProps({ onReleaseClick })}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ReleaseCardGrid = memo(ReleaseCardGridComponent);
