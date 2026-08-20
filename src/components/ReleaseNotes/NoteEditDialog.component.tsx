"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import Button from "src/components/Button/Button.component";
import { ModalToolbar } from "src/components/ModalToolbar/ModalToolbar.component";
import { ScrollModal } from "src/components/ScrollModal/ScrollModal.component";
import {
  buildReleaseNotesFormSchema,
  type ReleaseNotesFormValues,
} from "src/lib/validation/releaseNotes.schemas";
import type { DiscogsCollectionField, DiscogsRelease } from "src/types";
import { getReleaseImageUrl } from "src/utils/helpers";
import {
  formatArtistNames,
  formatReleaseMetaLine,
} from "src/utils/releaseDisplay";
import {
  getEditableConditionFields,
  getReleaseNotes,
  isEditableCollectionField,
  normalizeFieldId,
  parseReleaseId,
} from "src/utils/releaseNotes";
import styles from "./NoteEditDialog.module.css";
import { ReleaseNotesFormFields } from "./ReleaseNotesFormFields.component";

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
  const editableTextFields = useMemo(
    () => fields.filter((field) => isEditableCollectionField(field)),
    [fields],
  );

  const editableConditionFields = useMemo(
    () => getEditableConditionFields(fields),
    [fields],
  );

  const formFields = useMemo(
    () => [...editableTextFields, ...editableConditionFields],
    [editableConditionFields, editableTextFields],
  );

  const initialValues = useMemo(() => {
    const values = new Map<number, string>();

    for (const field of formFields) {
      const existingNote = getReleaseNotes(release).find(
        (note) => normalizeFieldId(note.field_id) === field.id,
      );
      values.set(field.id, existingNote?.value ?? "");
    }

    return values;
  }, [formFields, release]);

  const defaultFormValues = useMemo(() => {
    const values: ReleaseNotesFormValues = {};

    for (const field of formFields) {
      values[String(field.id)] = initialValues.get(field.id) ?? "";
    }

    return values;
  }, [formFields, initialValues]);

  const noteFormSchema = useMemo(
    () =>
      buildReleaseNotesFormSchema(editableTextFields.map((field) => field.id)),
    [editableTextFields],
  );

  const {
    formState: { errors, isValid },
    handleSubmit,
    reset,
    setValue,
    watch,
  } = useForm<ReleaseNotesFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const formValues = watch();
  const textFieldErrors = useMemo(() => {
    const fieldErrors: Record<string, { message?: string }> = {};

    for (const field of editableTextFields) {
      const fieldKey = String(field.id);
      const message = errors[fieldKey]?.message;

      if (typeof message === "string") {
        fieldErrors[fieldKey] = { message };
      }
    }

    return fieldErrors;
  }, [editableTextFields, errors]);

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
    const changedValues = formFields
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

        {formFields.length === 0 ? (
          <p className={styles.subtitle}>
            No editable note fields are configured in your Discogs collection.
          </p>
        ) : (
          <ReleaseNotesFormFields
            textFields={editableTextFields}
            conditionFields={editableConditionFields}
            values={formValues}
            disabled={isSaving}
            textFieldErrors={textFieldErrors}
            onTextFieldChange={(fieldId, event) => {
              setValue(String(fieldId), event.target.value, {
                shouldDirty: true,
              });
            }}
            onConditionFieldChange={(fieldId, value) => {
              setValue(String(fieldId), value, { shouldDirty: true });
            }}
          />
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
              isSaving || formFields.length === 0 || !releaseId || !isValid
            }
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </ScrollModal>
  );
};
