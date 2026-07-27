import { useMemo } from "react";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { definedProps } from "src/utils/definedProps";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";
import { CrateDrawerReleaseItem } from "./CrateDrawerReleaseItem.component";

export const CrateDrawerReleases = () => {
  const {
    currentView,
    hidePackedItems,
    isPacked,
    isLoadingReleases,
    onReleaseClick,
    packedCount,
    removeFromCrate,
    selectedReleases,
    setPacked,
    setHidePackedItems,
  } = useCrateDrawerContext();

  const visibleReleases = useMemo(() => {
    if (!hidePackedItems) {
      return selectedReleases;
    }

    return selectedReleases.filter((release) => !isPacked(release.instance_id));
  }, [hidePackedItems, isPacked, selectedReleases]);

  if (isLoadingReleases) {
    return (
      <div className={styles.emptyState}>
        <PageLoader message="Loading crate..." />
      </div>
    );
  }

  if (selectedReleases.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3>No releases added to your crate yet.</h3>
        <p>
          {currentView === "list"
            ? "Toggle the checkbox on any release to add it to this crate"
            : 'Click the "+ Add to Crate" button on any release to add it to this crate'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.releasesSection}>
      {packedCount > 0 ? (
        <div className={styles.releasesListHeader}>
          <span className={styles.foundProgress}>
            {packedCount} of {selectedReleases.length} packed
          </span>
          <label className={styles.packedFilterLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={hidePackedItems}
              onChange={(event) => setHidePackedItems(event.target.checked)}
              aria-label="Hide items marked as packed"
              title="Hide items marked as packed"
            />
            <span>Hide packed items</span>
          </label>
        </div>
      ) : null}
      {visibleReleases.length === 0 ? (
        <div className={styles.emptyState}>
          <p>All items are packed.</p>
        </div>
      ) : (
        <div className={styles.releasesList}>
          {visibleReleases.map((release) => (
            <CrateDrawerReleaseItem
              key={release.instance_id}
              release={release}
              packed={isPacked(release.instance_id)}
              onPackedChange={(packed) =>
                setPacked(release.instance_id, packed)
              }
              onRemove={removeFromCrate}
              {...definedProps({ onReleaseClick })}
            />
          ))}
        </div>
      )}
    </div>
  );
};
