"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "src/components/Button/Button.component";
import type { DiscogsCollectionField, DiscogsRelease } from "src/types";
import { getReleaseImageUrl } from "src/utils/helpers";
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
  onClose: () => void;
  onSave: (values: Array<{ fieldId: number; value: string }>) => void;
}

const formatArtistNames = (release: DiscogsRelease): string => {
  return release.basic_information.artists
    .map((artist) => artist.name)
    .filter(Boolean)
    .join(", ");
};

const formatMetaLine = (release: DiscogsRelease): string => {
  const { labels, year } = release.basic_information;
  const parts: string[] = [];

  if (labels[0]?.name) {
    parts.push(labels[0].name);
  }

  if (year > 0) {
    parts.push(String(year));
  }

  const catno = labels[0]?.catno ? String(labels[0].catno) : "";
  if (catno) {
    parts.push(catno);
  }

  return parts.join(" · ");
};

export const NoteEditDialog = ({
  isOpen,
  release,
  fields,
  isSaving,
  errorMessage,
  onClose,
  onSave,
}: NoteEditDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  const [draftValues, setDraftValues] = useState(initialValues);

  useEffect(() => {
    if (isOpen) {
      setDraftValues(initialValues);
    }
  }, [initialValues, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleCancel = useCallback(
    (event?: React.SyntheticEvent) => {
      event?.preventDefault();
      if (!isSaving) {
        onClose();
      }
    },
    [isSaving, onClose],
  );

  const handleSave = useCallback(() => {
    const changedValues = editableFields
      .map((field) => {
        const nextValue = draftValues.get(field.id) ?? "";
        const previousValue = initialValues.get(field.id) ?? "";

        if (nextValue.trim() === previousValue.trim()) {
          return null;
        }

        return {
          fieldId: field.id,
          value: nextValue.trim(),
        };
      })
      .filter(
        (value): value is { fieldId: number; value: string } => value !== null,
      );

    onSave(changedValues);
  }, [draftValues, editableFields, initialValues, onSave]);

  const { basic_information: info } = release;
  const thumbUrl = getReleaseImageUrl({
    thumb: info.thumb,
    cover_image: info.cover_image,
    width: 120,
    height: 120,
    preferCoverImage: true,
  });
  const metaLine = formatMetaLine(release);
  const releaseId = parseReleaseId(release);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      data-testid="fmdNoteEditDialog"
      onCancel={handleCancel}
      onClose={handleCancel}
      aria-labelledby="note-edit-title"
    >
      <div className={styles.dialogContent}>
        <h2 id="note-edit-title" className={styles.title}>
          Add release notes
        </h2>

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
            <p className={styles.albumTitle}>{info.title}</p>
            <p className={styles.artist}>{formatArtistNames(release)}</p>
            {metaLine ? <p className={styles.metaLine}>{metaLine}</p> : null}
          </div>
        </div>

        {editableFields.length === 0 ? (
          <p className={styles.subtitle}>
            No editable text fields are configured in your Discogs collection.
          </p>
        ) : (
          editableFields.map((field) => (
            <div className={styles.fieldGroup} key={field.id}>
              <label
                className={styles.label}
                htmlFor={`note-field-${field.id}`}
              >
                {field.name}
              </label>
              <textarea
                id={`note-field-${field.id}`}
                className={styles.textarea}
                value={draftValues.get(field.id) ?? ""}
                onChange={(event) => {
                  setDraftValues((current) => {
                    const next = new Map(current);
                    next.set(field.id, event.target.value);
                    return next;
                  });
                }}
                disabled={isSaving}
              />
            </div>
          ))
        )}

        {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

        <div className={styles.actions}>
          <Button
            variant="secondary"
            size="md"
            onPress={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onPress={handleSave}
            disabled={isSaving || editableFields.length === 0 || !releaseId}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </dialog>
  );
};
