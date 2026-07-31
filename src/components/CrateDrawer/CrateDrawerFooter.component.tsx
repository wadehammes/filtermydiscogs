import classNames from "classnames";
import Link from "next/link";
import Button from "src/components/Button/Button.component";
import EditIcon from "src/styles/icons/edit-thin.svg";
import StarIcon from "src/styles/icons/star-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateDrawerFooter.module.css";
import { CrateSetNotesScratchpad } from "./CrateSetNotesScratchpad.component";
import { CrateShareControls } from "./CrateShareControls.component";

export const CrateDrawerFooter = () => {
  const {
    activeCrateId,
    isDefaultCrate,
    isDeletingCrate,
    isUpdatingCrate,
    selectedReleases,
    setShowClearDialog,
    setShowMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  return (
    <div className={styles.footer}>
      <CrateSetNotesScratchpad variant="drawer" />
      <div className={styles.footerActionsRow}>
        <div
          className={classNames(
            segmentedStyles.container,
            styles.footerSegmented,
          )}
        >
          {activeCrateId ? (
            <Link
              href={`/crates/${activeCrateId}`}
              className={classNames(
                segmentedStyles.segment,
                styles.footerSegment,
              )}
            >
              <span className={styles.footerSegmentIcon} aria-hidden>
                <EditIcon />
              </span>
              <span>Open crate</span>
            </Link>
          ) : (
            <span
              className={classNames(
                segmentedStyles.segment,
                styles.footerSegment,
                styles.footerSegmentDisabled,
              )}
              aria-disabled="true"
            >
              <span className={styles.footerSegmentIcon} aria-hidden>
                <EditIcon />
              </span>
              <span>Open crate</span>
            </span>
          )}
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
      <CrateShareControls variant="footer" />
    </div>
  );
};
