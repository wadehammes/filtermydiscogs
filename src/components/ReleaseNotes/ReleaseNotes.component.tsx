"use client";

import classNames from "classnames";
import type { DiscogsRelease } from "src/types";
import { releaseHasStoredConditionNotes } from "src/utils/releaseNotes";
import { NoteEditDialog } from "./NoteEditDialog.component";
import styles from "./ReleaseNotes.module.css";
import { ReleaseNotesCrateScratchpad } from "./ReleaseNotesCrateScratchpad.component";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";
import { ReleaseNotesModalEditor } from "./ReleaseNotesModalEditor.component";
import { useReleaseNotesEditor } from "./useReleaseNotesEditor.hook";

interface ReleaseNotesProps {
  release: DiscogsRelease;
  variant?: "inline" | "displayOnly" | "table" | "crate" | "modal";
  className?: string | undefined;
}

const ReleaseNotesCardDisplay = ({
  release,
  className,
}: {
  release: DiscogsRelease;
  className?: string | undefined;
}) => {
  const { canEdit, cardDisplayedNotes, openDialog } =
    useReleaseNotesEditorContext();

  const hasNotes = cardDisplayedNotes.length > 0;

  return (
    <div
      className={classNames(styles.notes, styles.notesCard, className)}
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
  );
};

const ReleaseNotesModal = ({ release }: { release: DiscogsRelease }) => {
  const { canEdit, cardDisplayedNotes, displayedNotes, fields } =
    useReleaseNotesEditorContext();

  const hasStoredConditions = releaseHasStoredConditionNotes(release, fields);
  const hasTextNotes = cardDisplayedNotes.length > 0;
  const showSection = canEdit || hasTextNotes || hasStoredConditions;

  if (!showSection) {
    return null;
  }

  return (
    <div
      className={classNames(styles.notes, styles.notesModal)}
      data-testid="fmdReleaseNotes"
    >
      {canEdit ? (
        <ReleaseNotesModalEditor release={release} />
      ) : (
        <>
          <h3 className={styles.noteHeading} id="release-modal-notes-heading">
            Notes
          </h3>
          <section
            aria-labelledby="release-modal-notes-heading"
            className={styles.noteScrollModal}
          >
            {displayedNotes.map((note) => (
              <div
                className={styles.noteRow}
                key={`${release.instance_id}-${note.fieldId}`}
              >
                <span className={styles.noteLabel}>{note.label}</span>
                <p className={styles.noteContent}>{note.value}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
};

const ReleaseNotesTable = ({ release }: { release: DiscogsRelease }) => {
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
  } = useReleaseNotesEditor(release);

  return (
    <>
      <div
        className={classNames(styles.notes, styles.notesTable)}
        data-testid="fmdReleaseNotes"
      >
        {cardDisplayedNotes.length > 0 ? (
          cardDisplayedNotes.map((note) => (
            <div
              className={styles.noteRow}
              key={`${release.instance_id}-${note.fieldId}`}
            >
              <p className={styles.noteContent}>{note.value}</p>
            </div>
          ))
        ) : canEdit ? (
          <button
            type="button"
            className={styles.addNotesLink}
            onClick={openDialog}
          >
            Add notes
          </button>
        ) : (
          <span className={styles.emptyNotes}>—</span>
        )}

        {canEdit && cardDisplayedNotes.length > 0 ? (
          <button
            type="button"
            className={styles.editButton}
            onClick={openDialog}
          >
            Edit
          </button>
        ) : null}
      </div>

      {isDialogOpen ? (
        <NoteEditDialog
          isOpen={isDialogOpen}
          release={release}
          fields={fields}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onClose={closeDialog}
          onSave={handleSave}
        />
      ) : null}
    </>
  );
};

const ReleaseNotesCrate = ({ release }: { release: DiscogsRelease }) => {
  return <ReleaseNotesCrateScratchpad release={release} />;
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
            <span className={styles.noteLabel}>{note.label}</span>
            <p className={styles.noteContent}>{note.value}</p>
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

      {isDialogOpen ? (
        <NoteEditDialog
          isOpen={isDialogOpen}
          release={release}
          fields={fields}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onClose={closeDialog}
          onSave={handleSave}
        />
      ) : null}
    </>
  );
};

export const ReleaseNotes = ({
  release,
  variant = "inline",
  className,
}: ReleaseNotesProps) => {
  if (variant === "displayOnly") {
    return <ReleaseNotesCardDisplay release={release} className={className} />;
  }

  if (variant === "modal") {
    return <ReleaseNotesModal release={release} />;
  }

  if (variant === "table") {
    return <ReleaseNotesTable release={release} />;
  }

  if (variant === "crate") {
    return <ReleaseNotesCrate release={release} />;
  }

  return <ReleaseNotesInline release={release} />;
};
