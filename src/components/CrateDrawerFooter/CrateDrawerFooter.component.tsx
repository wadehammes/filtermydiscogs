import classNames from "classnames";
import { useEffect } from "react";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerFooterActionsMenu } from "src/components/CrateDrawerFooterActionsMenu/CrateDrawerFooterActionsMenu.component";
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
import { BELOW_DESKTOP_LAYOUT_MEDIA_QUERY } from "src/constants/layoutMediaQueries";
import { useMediaQuery } from "src/hooks/useMediaQuery.hook";
import EditIcon from "src/styles/icons/edit-thin.svg";
import NoteStickyIcon from "src/styles/icons/note-sticky-thin.svg";
import styles from "./CrateDrawerFooter.module.css";

export const CrateDrawerFooter = () => {
  const isBelowDesktop = useMediaQuery(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY);
  const {
    activeCrateId,
    drawerNotesOpen,
    isDeletingCrate,
    isUpdatingCrate,
    setDrawerNotesOpen,
  } = useCrateDrawerContext();

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

  const openCrateControl = activeCrateId ? (
    <IconButtonLink
      internal
      href={`/crates/${activeCrateId}`}
      className={classNames(segmentedStyles.segment, styles.footerSegment)}
      iconClassName={styles.footerSegmentIcon}
      label="Open crate"
    >
      <EditIcon />
    </IconButtonLink>
  ) : (
    <span
      className={classNames(segmentedStyles.segment, styles.footerSegment)}
      aria-disabled="true"
    >
      <span className={styles.footerSegmentIcon} aria-hidden>
        <EditIcon />
      </span>
      <span>Open crate</span>
    </span>
  );

  const notesControl = (
    <IconButton
      className={classNames(segmentedStyles.segment, styles.footerSegment, {
        [segmentedStyles.active]: drawerNotesOpen,
      })}
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
  );

  const moreMenu = (
    <CrateDrawerFooterActionsMenu
      shareInMenu={isBelowDesktop}
      triggerClassName={classNames(
        segmentedStyles.segment,
        styles.footerSegment,
      )}
      triggerIconClassName={styles.footerSegmentIcon}
    />
  );

  return (
    <div className={styles.footer} data-testid="fmdCrateDrawerFooter">
      <div hidden={!drawerNotesOpen} className={styles.drawerNotesWrap}>
        <CrateSetNotesScratchpad variant="drawer" />
      </div>
      <div className={styles.footerActions}>
        <SegmentedControl
          legend="Crate drawer actions"
          allowOverflow
          className={styles.footerSegmented}
        >
          {openCrateControl}
          {notesControl}
          {moreMenu}
        </SegmentedControl>
      </div>
      {isBelowDesktop ? null : <CrateShareControls variant="footer" />}
    </div>
  );
};
