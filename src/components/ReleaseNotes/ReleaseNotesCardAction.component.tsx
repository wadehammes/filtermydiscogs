"use client";

import classNames from "classnames";
import cardStyles from "src/components/ReleaseCard/ReleaseCard.module.css";
import NoteStickyIcon from "src/styles/icons/note-sticky-solid.svg";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";

export const ReleaseNotesCardAction = () => {
  const { canEdit, hasNotes, openDialog } = useReleaseNotesEditorContext();

  if (!canEdit) {
    return null;
  }

  return (
    <div className={cardStyles.buttonWrapper}>
      <button
        type="button"
        className={classNames(
          cardStyles.listButton,
          hasNotes && cardStyles.notesButtonActive,
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          openDialog();
        }}
        aria-label={hasNotes ? "Edit release notes" : "Add release notes"}
        title={hasNotes ? "Edit release notes" : "Add release notes"}
      >
        <NoteStickyIcon className={cardStyles.listButtonIcon} />
      </button>
      <span className={cardStyles.tooltip}>
        {hasNotes ? "Edit release notes" : "Add release notes"}
      </span>
    </div>
  );
};
