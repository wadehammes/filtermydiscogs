import classNames from "classnames";
import Button from "src/components/Button/Button.component";
import EditIcon from "src/styles/icons/edit-thin.svg";
import NoteStickyIcon from "src/styles/icons/note-sticky-thin.svg";
import StarIcon from "src/styles/icons/star-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawer.module.css";
import { CrateDrawerNotes } from "./CrateDrawerNotes.component";

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
    setShowCrateNotesDialog,
    setShowEditCrateDialog,
    setShowMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  return (
    <div className={styles.footer}>
      <CrateDrawerNotes />
      <div className={styles.footerActionsRow}>
        <div
          className={classNames(
            segmentedStyles.container,
            styles.footerSegmented,
          )}
        >
          <button
            type="button"
            className={classNames(
              segmentedStyles.segment,
              styles.footerSegment,
            )}
            onClick={() => setShowEditCrateDialog(true)}
            disabled={!activeCrateId || isBusy}
          >
            <span className={styles.footerSegmentIcon} aria-hidden>
              <EditIcon />
            </span>
            <span>Edit</span>
          </button>
          <button
            type="button"
            className={classNames(
              segmentedStyles.segment,
              styles.footerSegment,
            )}
            onClick={() => setShowCrateNotesDialog(true)}
            disabled={!activeCrateId || isBusy}
          >
            <span className={styles.footerSegmentIcon} aria-hidden>
              <NoteStickyIcon />
            </span>
            <span>Notes</span>
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
        <Button
          variant="danger"
          size="sm"
          className={styles.emptyCrateButton}
          onPress={() => setShowClearDialog(true)}
          disabled={releaseCount === 0 || isBusy}
        >
          <span className={styles.footerSegmentIcon} aria-hidden>
            <TrashOpenIcon />
          </span>
          Empty
        </Button>
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
