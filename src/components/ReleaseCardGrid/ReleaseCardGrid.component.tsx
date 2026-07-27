import { memo, useMemo } from "react";
import { PublicMobileReleaseCard } from "src/components/ReleaseCard/PublicMobileReleaseCard.component";
import { PublicReleaseCard } from "src/components/ReleaseCard/PublicReleaseCard.component";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
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
  const isMobile = useMediaQuery("(max-width: 1023px)");

  const gridStyle = useMemo(
    () => ({
      display: "grid",
      gap: "var(--space-4)",
      gridTemplateColumns: isMobile
        ? "1fr"
        : "repeat(auto-fill, minmax(280px, 1fr))",
      padding: "0",
    }),
    [isMobile],
  );

  return (
    <div className={styles.releasesGrid} style={gridStyle}>
      {releases.map((release: DiscogsRelease) => (
        <div key={release.instance_id} id={`release-${release.instance_id}`}>
          {isMobile ? (
            <PublicMobileReleaseCard
              release={release}
              {...definedProps({ onReleaseClick })}
            />
          ) : (
            <PublicReleaseCard
              release={release}
              {...definedProps({ onReleaseClick })}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export const ReleaseCardGrid = memo(ReleaseCardGridComponent);
