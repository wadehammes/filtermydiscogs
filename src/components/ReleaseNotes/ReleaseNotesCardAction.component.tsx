"use client";

import classNames from "classnames";
import cardStyles from "src/components/ReleaseCard/ReleaseCard.module.css";
import NoteStickyIcon from "src/styles/icons/note-sticky-thin.svg";
import segmentedStyles from "src/styles/modules/segmented-control.module.css";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import styles from "./ReleaseNotesCardAction.module.css";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";

type ReleaseNotesCardActionVariant = "card" | "mobile";

interface ReleaseNotesCardActionProps {
  variant?: ReleaseNotesCardActionVariant;
}

export const ReleaseNotesCardAction = ({
  variant = "card",
}: ReleaseNotesCardActionProps) => {
  const { canEdit, hasNotes, openDialog } = useReleaseNotesEditorContext();
  const isMobile = variant === "mobile";
  const label = hasNotes ? "Edit release notes" : "Add release notes";

  if (!canEdit) {
    return null;
  }

  const notesButton = (
    <button
      type="button"
      className={classNames(
        isMobile ? stackStyles.overlayAction : segmentedStyles.segment,
        isMobile && stackStyles.overlayActionMobile,
        !isMobile && cardStyles.actionSegment,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openDialog();
      }}
      aria-label={label}
      title={label}
    >
      <span className={styles.iconWrap}>
        <NoteStickyIcon className={stackStyles.actionIcon} />
        {hasNotes ? (
          <span
            className={styles.notesDot}
            data-testid="fmdReleaseNotesIndicator"
            aria-hidden="true"
          />
        ) : null}
      </span>
    </button>
  );

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
