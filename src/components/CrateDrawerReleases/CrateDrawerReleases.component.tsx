import { useMemo } from "react";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerReleaseItem } from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.component";
import { CrateReleaseListToolbar } from "src/components/CrateReleaseListToolbar/CrateReleaseListToolbar.component";
import { EmptyState } from "src/components/EmptyState/EmptyState.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import {
  countVisibleCrateReleases,
  getCrateLayoutReleaseItems,
  getVisibleCrateLayoutItems,
} from "src/lib/crate-layout";
import { definedProps } from "src/utils/definedProps";
import styles from "./CrateDrawerReleases.module.css";

export const CrateDrawerReleases = () => {
  const {
    currentView,
    hidePackedItems,
    isLoadingReleases,
    isPacked,
    layoutItems,
    onReleaseClick,
    packedCount,
    packedEnabled,
    removeFromCrate,
    selectedReleases,
    setPacked,
  } = useCrateDrawerContext();

  const stagingReleases = useMemo(
    () => getCrateLayoutReleaseItems(layoutItems),
    [layoutItems],
  );

  const visibleReleases = useMemo(() => {
    return getCrateLayoutReleaseItems(
      getVisibleCrateLayoutItems({
        items: layoutItems,
        hidePackedItems,
        isPacked,
        packedEnabled,
      }),
    );
  }, [hidePackedItems, isPacked, layoutItems, packedEnabled]);

  if (isLoadingReleases) {
    return (
      <div className={styles.loadingState}>
        <PageLoader message="Loading crate..." />
      </div>
    );
  }

  if (stagingReleases.length === 0) {
    return (
      <EmptyState
        variant="panel"
        title="No releases added yet."
        description={
          currentView === "list"
            ? "Toggle the checkbox on any release to stage it in this crate."
            : 'Click "+ Add to Crate" on any release to stage it here.'
        }
        className={styles.emptyState}
      />
    );
  }

  const visibleReleaseCount = countVisibleCrateReleases({
    items: layoutItems,
    hidePackedItems,
    isPacked,
    packedEnabled,
  });
  const showAllPackedState =
    packedEnabled && visibleReleaseCount === 0 && selectedReleases.length > 0;
  const showPackingToolbar = packedEnabled && packedCount > 0;

  return (
    <div className={styles.releasesSection}>
      {showPackingToolbar ? (
        <div className={styles.packingToolbarSticky}>
          <CrateReleaseListToolbar
            sticky={false}
            className={styles.packingToolbar}
          />
        </div>
      ) : null}
      {showAllPackedState ? (
        <EmptyState
          variant="panel"
          title="All albums packed for your gig."
          className={styles.emptyState}
        />
      ) : visibleReleases.length > 0 ? (
        <div className={styles.releasesList}>
          {visibleReleases.map((item) => (
            <CrateDrawerReleaseItem
              key={item.instance_id}
              release={item.release}
              packed={packedEnabled ? isPacked(item.instance_id) : false}
              onPackedChange={(packed) => setPacked(item.instance_id, packed)}
              onRemove={removeFromCrate}
              {...definedProps({ onReleaseClick })}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
