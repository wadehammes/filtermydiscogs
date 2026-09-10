import classNames from "classnames";
import { useEffect } from "react";
import Button from "src/components/Button/Button.component";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import {
  CRATE_SET_NOTES_SCRATCHPAD_ID,
  CrateSetNotesScratchpad,
} from "src/components/CrateSetNotesScratchpad/CrateSetNotesScratchpad.component";
import { CrateShareControls } from "src/components/CrateShareControls/CrateShareControls.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { IconButtonLink } from "src/components/IconButton/IconButtonLink.component";
import {
  SegmentedControl,
  segmentedStyles,
} from "src/components/SegmentedControl/SegmentedControl.component";
import EditIcon from "src/styles/icons/edit-thin.svg";
import NoteStickyIcon from "src/styles/icons/note-sticky-thin.svg";
import StarIcon from "src/styles/icons/star-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import styles from "./CrateDrawerFooter.module.css";

export const CrateDrawerFooter = () => {
  const {
    activeCrateId,
    drawerNotesOpen,
    isDefaultCrate,
    isDeletingCrate,
    isUpdatingCrate,
    selectedReleases,
    setDrawerNotesOpen,
    setShowClearDialog,
    setShowMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  useEffect(() => {
    if (!drawerNotesOpen) {
      return;
    }

    const textarea = document.getElementById(CRATE_SET_NOTES_SCRATCHPAD_ID);

    if (textarea instanceof HTMLTextAreaElement) {
      textarea.focus();
    }
  }, [drawerNotesOpen]);

  return (
    <div className={styles.footer}>
      <div hidden={!drawerNotesOpen} className={styles.drawerNotesWrap}>
        <CrateSetNotesScratchpad variant="drawer" />
      </div>
      <div className={styles.footerActionsRow}>
        <SegmentedControl
          legend="Crate drawer actions"
          className={styles.footerSegmented}
        >
          {activeCrateId ? (
            <IconButtonLink
              internal
              href={`/crates/${activeCrateId}`}
              className={classNames(
                segmentedStyles.segment,
                styles.footerSegment,
              )}
              iconClassName={styles.footerSegmentIcon}
              label="Open crate"
            >
              <EditIcon />
            </IconButtonLink>
          ) : (
            <span
              className={classNames(
                segmentedStyles.segment,
                styles.footerSegment,
              )}
              aria-disabled="true"
            >
              <span className={styles.footerSegmentIcon} aria-hidden>
                <EditIcon />
              </span>
              <span>Open crate</span>
            </span>
          )}
          <IconButton
            className={classNames(
              segmentedStyles.segment,
              styles.footerSegment,
              {
                [segmentedStyles.active]: drawerNotesOpen,
              },
            )}
            iconClassName={styles.footerSegmentIcon}
            label="Notes"
            onClick={() => setDrawerNotesOpen((open) => !open)}
            disabled={!activeCrateId || isBusy}
            aria-pressed={drawerNotesOpen}
            aria-controls={CRATE_SET_NOTES_SCRATCHPAD_ID}
            aria-expanded={drawerNotesOpen}
          >
            <NoteStickyIcon />
          </IconButton>
          {!isDefaultCrate ? (
            <IconButton
              className={classNames(
                segmentedStyles.segment,
                styles.footerSegment,
              )}
              iconClassName={styles.footerSegmentIcon}
              label={isUpdatingCrate ? "Default…" : "Default"}
              onClick={() => setShowMakeDefaultDialog(true)}
              disabled={isBusy}
            >
              <StarIcon />
            </IconButton>
          ) : null}
        </SegmentedControl>
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
