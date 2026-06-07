"use client";

import classNames from "classnames";
import mobileCardStyles from "src/components/ReleaseCard/MobileReleaseCard.module.css";
import cardStyles from "src/components/ReleaseCard/ReleaseCard.module.css";
import NoteStickyIcon from "src/styles/icons/note-sticky-solid.svg";
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
      className={classNames(
        styles.listButton,
        hasNotes && styles.notesButtonActive,
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        openDialog();
      }}
      aria-label={hasNotes ? "Edit release notes" : "Add release notes"}
      title={hasNotes ? "Edit release notes" : "Add release notes"}
    >
      <NoteStickyIcon className={styles.listButtonIcon} />
    </button>
  );

  if (variant === "mobile") {
    return <div className={mobileCardStyles.actionSlot}>{notesButton}</div>;
  }

  return (
    <div className={styles.buttonWrapper}>
      {notesButton}
      <span className={cardStyles.tooltip}>
        {hasNotes ? "Edit release notes" : "Add release notes"}
      </span>
    </div>
  );
};
