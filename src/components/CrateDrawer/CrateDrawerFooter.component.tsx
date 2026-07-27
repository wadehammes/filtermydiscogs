import classNames from "classnames";
import Button from "src/components/Button/Button.component";
import StarIcon from "src/styles/icons/star-thin.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";

export const CrateDrawerFooter = () => {
  const {
    activeCrateId,
    copySuccess,
    handleClearPacked,
    handleCopyLink,
    handlePrivacyToggle,
    isDefaultCrate,
    isDeletingCrate,
    isPublic,
    isUpdatingCrate,
    packedCount,
    selectedReleases,
    setShowClearDialog,
    setShowEditCrateDialog,
    setShowMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  return (
    <div className={styles.footer}>
      <div
        className={classNames(
          segmentedStyles.container,
          styles.footerSegmented,
        )}
      >
        <button
          type="button"
          className={classNames(segmentedStyles.segment, styles.footerSegment)}
          onClick={() => setShowEditCrateDialog(true)}
          disabled={!activeCrateId || isBusy}
        >
          Edit
        </button>
        {packedCount > 0 ? (
          <button
            type="button"
            className={classNames(
              segmentedStyles.segment,
              styles.footerSegment,
            )}
            onClick={handleClearPacked}
            disabled={isBusy}
            aria-label="Clear all packed items"
          >
            Clear packed
          </button>
        ) : null}
        <button
          type="button"
          className={classNames(
            segmentedStyles.segment,
            styles.footerSegment,
            styles.footerSegmentDanger,
          )}
          onClick={() => setShowClearDialog(true)}
          disabled={releaseCount === 0}
        >
          Empty Crate
        </button>
        {!isDefaultCrate ? (
          <button
            type="button"
            className={classNames(
              segmentedStyles.segment,
              styles.footerSegment,
            )}
            onClick={() => setShowMakeDefaultDialog(true)}
            disabled={isBusy}
          >
            <span className={styles.footerSegmentIcon} aria-hidden>
              <StarIcon />
            </span>
            <span>{isUpdatingCrate ? "Default…" : "Default"}</span>
          </button>
        ) : null}
      </div>
      <div className={styles.sharingSection}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={() => void handlePrivacyToggle()}
            disabled={isBusy || !activeCrateId}
            className={styles.sharingCheckbox}
          />
          <span>Make shareable</span>
        </label>
        {isPublic && activeCrateId ? (
          <Button
            variant="secondary"
            size="sm"
            onPress={() => void handleCopyLink()}
            disabled={isBusy}
          >
            {copySuccess ? "Copied!" : "Copy Link"}
          </Button>
        ) : null}
      </div>
    </div>
  );
};
