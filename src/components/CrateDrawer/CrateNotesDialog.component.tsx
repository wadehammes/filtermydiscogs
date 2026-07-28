"use client";

import classNames from "classnames";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { CRATE_NOTES_MAX_LENGTH } from "src/constants/crate";
import modalInputStyles from "src/styles/modal-input.module.css";
import { useCrateDrawerContext } from "./CrateDrawer.context";
import styles from "./CrateNotesDialog.module.css";

type CrateNotesFormValues = {
  notes: string;
};

export const CrateNotesDialog = () => {
  const {
    crateName,
    crateNotes,
    handleSaveCrateNotes,
    isUpdatingCrate,
    setShowCrateNotesDialog,
    showCrateNotesDialog,
  } = useCrateDrawerContext();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const isSaving = isUpdatingCrate;

  const { register, handleSubmit, reset, watch, formState } =
    useForm<CrateNotesFormValues>({
      defaultValues: {
        notes: crateNotes,
      },
      mode: "onChange",
    });

  const notesValue = watch("notes") ?? "";
  const notesLength = notesValue.length;
  const notesLengthError = formState.errors.notes;
  const isNotesOverLimit = notesLength > CRATE_NOTES_MAX_LENGTH;

  useEffect(() => {
    if (showCrateNotesDialog) {
      reset({ notes: crateNotes });
    }
  }, [crateNotes, reset, showCrateNotesDialog]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (showCrateNotesDialog && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!showCrateNotesDialog && dialog.open) {
      dialog.close();
    }
  }, [showCrateNotesDialog]);

  useEffect(() => {
    if (!showCrateNotesDialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showCrateNotesDialog]);

  const handleClose = useCallback(
    (event?: React.SyntheticEvent) => {
      event?.preventDefault();
      if (!isSaving) {
        setShowCrateNotesDialog(false);
      }
    },
    [isSaving, setShowCrateNotesDialog],
  );

  const handleSave = handleSubmit(async ({ notes }) => {
    await handleSaveCrateNotes(notes);
    setShowCrateNotesDialog(false);
  });

  const trimmedNotesValue = notesValue.trim();
  const currentNotesValue = crateNotes.trim();
  const isSaveDisabled =
    trimmedNotesValue === currentNotesValue ||
    isSaving ||
    Boolean(notesLengthError) ||
    isNotesOverLimit;
  const dialogTitle = crateNotes.trim()
    ? "Edit crate notes"
    : "Add crate notes";

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      data-testid="fmdCrateNotesDialog"
      onCancel={handleClose}
      onClose={handleClose}
      aria-labelledby="crate-notes-title"
    >
      <form className={styles.dialogContent} onSubmit={handleSave}>
        <h2 id="crate-notes-title" className={styles.title}>
          {dialogTitle}
        </h2>

        <div className={styles.crateSummary}>
          <p className={styles.crateName}>{crateName}</p>
          <p className={styles.subtitle}>
            Notes appear in the crate drawer and on public crate pages when
            shareable.
          </p>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="crate-notes-input">
            Notes
          </label>
          <textarea
            id="crate-notes-input"
            className={classNames(
              styles.textarea,
              modalInputStyles.field,
              (notesLengthError || isNotesOverLimit) && styles.textareaInvalid,
            )}
            disabled={isSaving}
            maxLength={CRATE_NOTES_MAX_LENGTH}
            rows={6}
            aria-describedby="crate-notes-length"
            aria-invalid={
              notesLengthError || isNotesOverLimit ? true : undefined
            }
            {...register("notes", {
              maxLength: {
                value: CRATE_NOTES_MAX_LENGTH,
                message: `Notes must be ${CRATE_NOTES_MAX_LENGTH} characters or less`,
              },
            })}
          />
          <div className={styles.fieldFooter}>
            {notesLengthError ? (
              <p className={styles.error} role="alert">
                {notesLengthError.message}
              </p>
            ) : (
              <span className={styles.fieldFooterSpacer} aria-hidden />
            )}
            <p
              id="crate-notes-length"
              className={classNames(
                styles.charCount,
                isNotesOverLimit && styles.charCountLimit,
              )}
            >
              {notesLength} / {CRATE_NOTES_MAX_LENGTH}
            </p>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onPress={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSaveDisabled}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </dialog>
  );
};
