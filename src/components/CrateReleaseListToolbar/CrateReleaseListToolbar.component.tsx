"use client";

import classNames from "classnames";
import { useId } from "react";
import { Checkbox } from "src/components/Checkbox/Checkbox.component";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import textActionStyles from "src/styles/modules/text-action.module.css";
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

  const hidePackedCheckboxId = useId();
  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;
  const showToolbar = packedEnabled;

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
            className={textActionStyles.meta}
            onClick={() => setShowClearPackedDialog(true)}
            disabled={isBusy || packedCount === 0}
            aria-label="Clear all packed items"
          >
            Clear packed
          </button>
          <label
            className={styles.checkboxLabel}
            htmlFor={hidePackedCheckboxId}
          >
            <Checkbox
              id={hidePackedCheckboxId}
              checked={hidePackedItems}
              disabled={isBusy}
              onCheckedChange={setHidePackedItems}
            />
            <span>Hide packed</span>
          </label>
        </div>
      </div>
    </section>
  );
};
