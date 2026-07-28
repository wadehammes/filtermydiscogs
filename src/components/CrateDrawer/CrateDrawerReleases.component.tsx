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
    isDeletingCrate,
    isLoadingReleases,
    isPacked,
    isUpdatingCrate,
    onReleaseClick,
    packedCount,
    packedEnabled,
    removeFromCrate,
    selectedReleases,
    setHidePackedItems,
    setPacked,
    setShowClearPackedDialog,
  } = useCrateDrawerContext();

  const visibleReleases = useMemo(() => {
    if (!(packedEnabled && hidePackedItems)) {
      return selectedReleases;
    }

    return selectedReleases.filter((release) => !isPacked(release.instance_id));
  }, [hidePackedItems, isPacked, packedEnabled, selectedReleases]);

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

  const showAllPackedState =
    packedEnabled &&
    visibleReleases.length === 0 &&
    selectedReleases.length > 0;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  return (
    <div className={styles.releasesSection}>
      {packedCount > 0 ? (
        <div className={styles.releasesListHeader}>
          <span className={styles.foundProgress}>
            {packedCount} of {selectedReleases.length} packed for gig
          </span>
          <div className={styles.packingActions}>
            <button
              type="button"
              className={styles.clearPackedButton}
              onClick={() => setShowClearPackedDialog(true)}
              disabled={isBusy}
              aria-label="Clear all packed items"
            >
              Clear packed
            </button>
            <label className={styles.packedFilterLabel}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={hidePackedItems}
                onChange={(event) => setHidePackedItems(event.target.checked)}
                aria-label="Hide albums packed for your gig"
                title="Hide albums packed for your gig"
              />
              <span>Hide packed albums</span>
            </label>
          </div>
        </div>
      ) : null}
      {showAllPackedState ? (
        <div className={styles.emptyState}>
          <p>All albums packed for your gig.</p>
        </div>
      ) : visibleReleases.length > 0 ? (
        <div className={styles.releasesList}>
          {visibleReleases.map((release) => (
            <CrateDrawerReleaseItem
              key={release.instance_id}
              release={release}
              packed={packedEnabled ? isPacked(release.instance_id) : false}
              onPackedChange={(packed) =>
                setPacked(release.instance_id, packed)
              }
              onRemove={removeFromCrate}
              {...definedProps({ onReleaseClick })}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
