"use client";

import classNames from "classnames";
import mobileCardStyles from "src/components/ReleaseCard/MobileReleaseCard.module.css";
import cardStyles from "src/components/ReleaseCard/ReleaseCard.module.css";
import NoteStickyIcon from "src/styles/icons/note-sticky-solid.svg";
import segmentedStyles from "src/styles/segmented-control.module.css";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";

type ReleaseNotesCardActionVariant = "card" | "mobile";

interface ReleaseNotesCardActionProps {
  variant?: ReleaseNotesCardActionVariant;
}

export const ReleaseNotesCardAction = ({
  variant = "card",
}: ReleaseNotesCardActionProps) => {
  const { canEdit, hasNotes, openDialog } = useReleaseNotesEditorContext();
  const styles = variant === "mobile" ? mobileCardStyles : cardStyles;

  if (!canEdit) {
    return null;
  }

  const notesButton = (
    <button
      type="button"
      className={classNames(segmentedStyles.segment, styles.actionSegment)}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openDialog();
      }}
      aria-label={hasNotes ? "Edit release notes" : "Add release notes"}
      title={hasNotes ? "Edit release notes" : "Add release notes"}
    >
      <NoteStickyIcon className={styles.actionIcon} />
    </button>
  );

  if (variant === "card") {
    return (
      <div className={cardStyles.segmentSlot}>
        {notesButton}
        <span className={cardStyles.tooltip}>
          {hasNotes ? "Edit release notes" : "Add release notes"}
        </span>
      </div>
    );
  }

  return notesButton;
};
