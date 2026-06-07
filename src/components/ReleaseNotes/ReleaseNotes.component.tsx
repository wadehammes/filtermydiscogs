"use client";

import classNames from "classnames";
import type { DiscogsRelease } from "src/types";
import { NoteEditDialog } from "./NoteEditDialog.component";
import styles from "./ReleaseNotes.module.css";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";
import { useReleaseNotesEditor } from "./useReleaseNotesEditor.hook";

interface ReleaseNotesProps {
  release: DiscogsRelease;
  variant?: "inline" | "displayOnly";
}

const ReleaseNotesCardDisplay = ({ release }: { release: DiscogsRelease }) => {
  const {
    canEdit,
    cardDisplayedNotes,
    closeDialog,
    errorMessage,
    fields,
    handleSave,
    isDialogOpen,
    isSaving,
    openDialog,
  } = useReleaseNotesEditorContext();

  const hasNotes = cardDisplayedNotes.length > 0;

  return (
    <>
      <div
        className={classNames(styles.notes, styles.notesCard)}
        data-testid="fmdReleaseNotes"
      >
        {hasNotes ? (
          <h4 className={styles.noteHeading} id="release-notes-heading">
            Notes
          </h4>
        ) : null}
        <section
          aria-labelledby="release-notes-heading"
          className={styles.noteScroll}
        >
          {hasNotes ? (
            cardDisplayedNotes.map((note) => (
              <p
                className={styles.noteContent}
                key={`${release.instance_id}-${note.fieldId}`}
              >
                {note.value}
              </p>
            ))
          ) : canEdit ? (
            <button
              type="button"
              className={styles.addNotesLink}
              onClick={openDialog}
            >
              Add notes
            </button>
          ) : null}
        </section>
      </div>

      <NoteEditDialog
        isOpen={isDialogOpen}
        release={release}
        fields={fields}
        isSaving={isSaving}
        errorMessage={errorMessage}
        onClose={closeDialog}
        onSave={handleSave}
      />
    </>
  );
};

const ReleaseNotesInline = ({ release }: { release: DiscogsRelease }) => {
  const {
    canEdit,
    closeDialog,
    displayedNotes,
    errorMessage,
    fields,
    handleSave,
    isDialogOpen,
    isSaving,
    openDialog,
  } = useReleaseNotesEditor(release);

  if (displayedNotes.length === 0 && !canEdit) {
    return null;
  }

  return (
    <>
      <div className={styles.notes} data-testid="fmdReleaseNotes">
        {displayedNotes.map((note) => (
          <div
            className={styles.noteRow}
            key={`${release.instance_id}-${note.fieldId}`}
          >
            <p className={styles.noteContent}>
              <span className={styles.noteLabel}>{note.label}:</span>{" "}
              {note.value}
            </p>
          </div>
        ))}

        {canEdit ? (
          <button
            type="button"
            className={styles.editButton}
            onClick={openDialog}
          >
            {displayedNotes.length > 0
              ? "Edit release notes"
              : "Add release notes"}
          </button>
        ) : null}
      </div>

      <NoteEditDialog
        isOpen={isDialogOpen}
        release={release}
        fields={fields}
        isSaving={isSaving}
        errorMessage={errorMessage}
        onClose={closeDialog}
        onSave={handleSave}
      />
    </>
  );
};

export const ReleaseNotes = ({
  release,
  variant = "inline",
}: ReleaseNotesProps) => {
  if (variant === "displayOnly") {
    return <ReleaseNotesCardDisplay release={release} />;
  }

  return <ReleaseNotesInline release={release} />;
};
