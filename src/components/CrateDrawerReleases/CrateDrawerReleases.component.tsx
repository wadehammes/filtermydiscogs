import { useMemo } from "react";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerReleaseItem } from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.component";
import { CrateReleaseListToolbar } from "src/components/CrateReleaseListToolbar/CrateReleaseListToolbar.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { useCrateReleaseDjMetadata } from "src/hooks/useReleaseTrackDjMetadata.hook";
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

  const { showDjMetadata, metadataById, isDjMetadataLoading } =
    useCrateReleaseDjMetadata({
      releases: visibleReleases.map((item) => item.release),
      enabled: packedEnabled,
    });

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
        <div className={styles.emptyState}>
          <p>All albums packed for your gig.</p>
        </div>
      ) : visibleReleases.length > 0 ? (
        <div className={styles.releasesList}>
          {visibleReleases.map((item) => (
            <CrateDrawerReleaseItem
              key={item.instance_id}
              release={item.release}
              packed={packedEnabled ? isPacked(item.instance_id) : false}
              showDjMetadata={showDjMetadata && packedEnabled}
              djMetadata={metadataById[item.instance_id] ?? null}
              isDjMetadataLoading={isDjMetadataLoading}
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
