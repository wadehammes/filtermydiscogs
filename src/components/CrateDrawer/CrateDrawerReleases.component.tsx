import { useMemo } from "react";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { getCrateLayoutReleaseItems } from "src/lib/crate-layout";
import { definedProps } from "src/utils/definedProps";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";
import { CrateDrawerReleaseItem } from "./CrateDrawerReleaseItem.component";

export const CrateDrawerReleases = () => {
  const {
    currentView,
    isLoadingReleases,
    layoutItems,
    onReleaseClick,
    removeFromCrate,
  } = useCrateDrawerContext();

  const stagingReleases = useMemo(
    () => getCrateLayoutReleaseItems(layoutItems),
    [layoutItems],
  );

  if (isLoadingReleases) {
    return (
      <div className={styles.emptyState}>
        <PageLoader message="Loading crate..." />
      </div>
    );
  }

  if (stagingReleases.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No releases added yet.</h3>
        <p>
          {currentView === "list"
            ? "Toggle the checkbox on any release to stage it in this crate."
            : 'Click "+ Add to Crate" on any release to stage it here.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.releasesSection}>
      <div className={styles.releasesList}>
        {stagingReleases.map((item) => (
          <CrateDrawerReleaseItem
            key={item.instance_id}
            release={item.release}
            onRemove={removeFromCrate}
            {...definedProps({ onReleaseClick })}
          />
        ))}
      </div>
    </div>
  );
};
