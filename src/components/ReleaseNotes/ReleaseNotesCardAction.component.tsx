"use client";

import classNames from "classnames";
import { IconButton } from "src/components/IconButton/IconButton.component";
import cardStyles from "src/components/ReleaseCard/ReleaseCard.module.css";
import { segmentedStyles } from "src/components/SegmentedControl/SegmentedControl.component";
import NoteStickyIcon from "src/styles/icons/note-sticky-thin.svg";
import tableRowActionStyles from "src/styles/modules/table-row-actions.module.css";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import styles from "./ReleaseNotesCardAction.module.css";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";

type ReleaseNotesCardActionVariant = "card" | "mobile" | "table";

interface ReleaseNotesCardActionProps {
  variant?: ReleaseNotesCardActionVariant;
}

export const ReleaseNotesCardAction = ({
  variant = "card",
}: ReleaseNotesCardActionProps) => {
  const { canEdit, hasNotes, openDialog } = useReleaseNotesEditorContext();
  const isMobile = variant === "mobile";
  const isTable = variant === "table";
  const label = hasNotes ? "Edit release notes" : "Add release notes";

  if (!canEdit) {
    return null;
  }

  const notesButton = (
    <IconButton
      className={classNames({
        [tableRowActionStyles.actionButton]: isTable,
        [stackStyles.overlayAction]: isMobile,
        [stackStyles.overlayActionMobile]: isMobile,
        [segmentedStyles.segment]: !(isMobile || isTable),
        [cardStyles.actionSegment]: !(isMobile || isTable),
      })}
      iconClassName={styles.iconWrap}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openDialog();
      }}
      aria-label={label}
      title={label}
    >
      <NoteStickyIcon className={stackStyles.actionIcon} />
      {hasNotes ? (
        <span
          className={styles.notesDot}
          data-testid="fmdReleaseNotesIndicator"
          aria-hidden="true"
        />
      ) : null}
    </IconButton>
  );

  if (isTable) {
    return notesButton;
  }

  if (isMobile) {
    return (
      <div
        className={classNames(
          stackStyles.overlayActionSlot,
          stackStyles.overlayActionSlotMobile,
        )}
      >
        {notesButton}
      </div>
    );
  }

  return (
    <div className={cardStyles.segmentSlot}>
      {notesButton}
      <span className={cardStyles.tooltip}>{label}</span>
    </div>
  );
};
