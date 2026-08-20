"use client";

import classNames from "classnames";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import styles from "./CrateReleaseListToolbar.module.css";

interface CrateReleaseListToolbarProps {
  className?: string | undefined;
  sticky?: boolean;
}

export const CrateReleaseListToolbar = ({
  className,
  sticky = true,
}: CrateReleaseListToolbarProps) => {
  const {
    hidePackedItems,
    isDeletingCrate,
    isUpdatingCrate,
    packedCount,
    packedEnabled,
    selectedReleases,
    setHidePackedItems,
    setShowClearPackedDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;
  const showToolbar = packedEnabled && packedCount > 0;

  if (!showToolbar) {
    return null;
  }

  return (
    <section
      className={classNames(styles.toolbar, className, {
        [styles.toolbarStickyPanel]: sticky,
      })}
      data-testid="fmdCrateReleaseListToolbar"
      aria-label="Gig packing"
    >
      <div className={styles.inner}>
        <span className={styles.progress}>
          {packedCount} of {releaseCount} packed for gig
        </span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => setShowClearPackedDialog(true)}
            disabled={isBusy}
            aria-label="Clear all packed items"
          >
            Clear packed
          </button>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={hidePackedItems}
              onChange={(event) => setHidePackedItems(event.target.checked)}
              disabled={isBusy}
              aria-label="Hide albums packed for your gig"
            />
            <span>Hide packed</span>
          </label>
        </div>
      </div>
    </section>
  );
};
