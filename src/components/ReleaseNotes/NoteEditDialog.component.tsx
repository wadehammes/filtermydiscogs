"use client";

import classNames from "classnames";
import Image from "next/image";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { ModalToolbar } from "src/components/shared/ModalToolbar/ModalToolbar.component";
import { ScrollModal } from "src/components/shared/ScrollModal/ScrollModal.component";
import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import modalInputStyles from "src/styles/modal-input.module.css";
import type { DiscogsCollectionField, DiscogsRelease } from "src/types";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
} from "src/utils/releaseDisplay";
import {
  getReleaseNotes,
  isEditableCollectionField,
  normalizeFieldId,
  parseReleaseId,
} from "src/utils/releaseNotes";
import styles from "./NoteEditDialog.module.css";

interface NoteEditDialogProps {
  isOpen: boolean;
  release: DiscogsRelease;
  fields: DiscogsCollectionField[];
  isSaving: boolean;
  errorMessage?: string | null;
  title?: string;
  onClose: () => void;
  onSave: (values: Array<{ fieldId: number; value: string }>) => void;
}

type NoteFormValues = Record<string, string>;

export const NoteEditDialog = ({
  isOpen,
  release,
  fields,
  isSaving,
  errorMessage,
  title = "Add release notes",
  onClose,
  onSave,
}: NoteEditDialogProps) => {
  const editableFields = useMemo(
    () => fields.filter((field) => isEditableCollectionField(field)),
    [fields],
  );

  const initialValues = useMemo(() => {
    const values = new Map<number, string>();

    for (const field of editableFields) {
      const existingNote = getReleaseNotes(release).find(
        (note) => normalizeFieldId(note.field_id) === field.id,
      );
      values.set(field.id, existingNote?.value ?? "");
    }

    return values;
  }, [editableFields, release]);

  const defaultFormValues = useMemo(() => {
    const values: NoteFormValues = {};

    for (const field of editableFields) {
      values[String(field.id)] = initialValues.get(field.id) ?? "";
    }

    return values;
  }, [editableFields, initialValues]);

  const { register, handleSubmit, reset, watch, formState } =
    useForm<NoteFormValues>({
      defaultValues: defaultFormValues,
      mode: "onChange",
    });

  const formValues = watch();
  const hasNoteLengthErrors = editableFields.some((field) => {
    const value = formValues[String(field.id)] ?? "";
    return value.length > COLLECTION_NOTE_MAX_LENGTH;
  });
  const hasNoteValidationErrors = editableFields.some((field) =>
    Boolean(formState.errors[String(field.id)]),
  );

  useEffect(() => {
    if (isOpen) {
      reset(defaultFormValues);
    }
  }, [defaultFormValues, isOpen, reset]);

  const handleClose = useCallback(() => {
    if (!isSaving) {
      onClose();
    }
  }, [isSaving, onClose]);

  const handleCancel = useCallback(
    (event?: React.SyntheticEvent) => {
      event?.preventDefault();
      handleClose();
    },
    [handleClose],
  );

  const handleSave = handleSubmit((data) => {
    const changedValues = editableFields
      .map((field) => {
        const nextValue = (data[String(field.id)] ?? "").trim();
        const previousValue = (initialValues.get(field.id) ?? "").trim();

        if (nextValue === previousValue) {
          return null;
        }

        return {
          fieldId: field.id,
          value: nextValue,
        };
      })
      .filter(
        (value): value is { fieldId: number; value: string } => value !== null,
      );

    onSave(changedValues);
  });

  const { basic_information: info } = release;
  const thumbUrl = getReleaseImageUrl({
    thumb: info.thumb,
    cover_image: info.cover_image,
    width: 120,
    height: 120,
    preferCoverImage: true,
  });
  const metaLine = formatReleaseMetaLine({ release });
  const releaseId = parseReleaseId(release);

  return (
    <ScrollModal
      isOpen={isOpen}
      onClose={handleClose}
      testId="fmdNoteEditDialog"
      ariaLabelledBy="note-edit-title"
      header={
        <ModalToolbar
          title={title}
          titleId="note-edit-title"
          onClose={handleCancel}
        />
      }
    >
      <form className={styles.form} onSubmit={handleSave}>
        <div className={styles.releaseSummary}>
          {thumbUrl ? (
            <div className={styles.coverWrapper}>
              <Image
                src={thumbUrl}
                alt={`${info.title} cover`}
                fill
                className={styles.coverImage}
                sizes="96px"
              />
            </div>
          ) : null}

          <div className={styles.releaseDetails}>
            <p className={styles.artist}>{formatArtistNames(release)}</p>
            <p className={styles.albumTitle}>{info.title}</p>
            {metaLine ? <p className={styles.metaLine}>{metaLine}</p> : null}
          </div>
        </div>

        {editableFields.length === 0 ? (
          <p className={styles.subtitle}>
            No editable text fields are configured in your Discogs collection.
          </p>
        ) : (
          editableFields.map((field) => {
            const fieldKey = String(field.id);
            const fieldValue = formValues[fieldKey] ?? "";
            const fieldLength = fieldValue.length;
            const fieldError = formState.errors[fieldKey];
            const isFieldOverLimit = fieldLength > COLLECTION_NOTE_MAX_LENGTH;

            return (
              <div className={styles.fieldGroup} key={field.id}>
                <label
                  className={styles.label}
                  htmlFor={`note-field-${field.id}`}
                >
                  {field.name}
                </label>
                <textarea
                  id={`note-field-${field.id}`}
                  className={classNames(
                    styles.textarea,
                    modalInputStyles.field,
                    (fieldError || isFieldOverLimit) && styles.textareaInvalid,
                  )}
                  disabled={isSaving}
                  maxLength={COLLECTION_NOTE_MAX_LENGTH}
                  aria-describedby={`note-field-${field.id}-length`}
                  aria-invalid={
                    fieldError || isFieldOverLimit ? true : undefined
                  }
                  {...register(fieldKey, {
                    maxLength: {
                      value: COLLECTION_NOTE_MAX_LENGTH,
                      message: `Notes must be ${COLLECTION_NOTE_MAX_LENGTH} characters or less`,
                    },
                  })}
                />
                <div className={styles.fieldFooter}>
                  {fieldError ? (
                    <p className={styles.fieldError} role="alert">
                      {fieldError.message}
                    </p>
                  ) : (
                    <span className={styles.fieldFooterSpacer} aria-hidden />
                  )}
                  <p
                    id={`note-field-${field.id}-length`}
                    className={classNames(
                      styles.charCount,
                      isFieldOverLimit && styles.charCountLimit,
                    )}
                  >
                    {fieldLength} / {COLLECTION_NOTE_MAX_LENGTH}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onPress={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={
              isSaving ||
              editableFields.length === 0 ||
              !releaseId ||
              hasNoteLengthErrors ||
              hasNoteValidationErrors
            }
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </ScrollModal>
  );
};
