"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import type { DiscogsRelease } from "src/types";
import { getReleaseNotes, normalizeFieldId } from "src/utils/releaseNotes";
import styles from "./ReleaseNotes.module.css";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";
import {
  getNoteFieldLabelId,
  ReleaseNotesFormFields,
} from "./ReleaseNotesFormFields.component";
import {
  dismissReleaseNotesSaveToast,
  showReleaseNotesSavedToast,
  showReleaseNotesSavingToast,
} from "./releaseNotesSaveToast";

const SAVE_DEBOUNCE_MS = 700;

const getFieldValues = (
  release: DiscogsRelease,
  fieldIds: number[],
): Record<string, string> => {
  const notes = getReleaseNotes(release);
  const values: Record<string, string> = {};

  for (const fieldId of fieldIds) {
    const existingNote = notes.find(
      (note) => normalizeFieldId(note.field_id) === fieldId,
    );
    values[String(fieldId)] = existingNote?.value ?? "";
  }

  return values;
};

export const ReleaseNotesModalEditor = ({
  release,
}: {
  release: DiscogsRelease;
}) => {
  const {
    editableConditionFields,
    editableFields,
    errorMessage,
    handleSave,
    isSaving,
  } = useReleaseNotesEditorContext();

  const formFieldIds = useMemo(
    () =>
      [...editableFields, ...editableConditionFields].map((field) => field.id),
    [editableConditionFields, editableFields],
  );

  const savedValues = useMemo(
    () => getFieldValues(release, formFieldIds),
    [formFieldIds, release],
  );

  const [draftValues, setDraftValues] = useState(savedValues);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const prevInstanceIdRef = useRef(release.instance_id);

  useEffect(() => {
    if (prevInstanceIdRef.current !== release.instance_id) {
      prevInstanceIdRef.current = release.instance_id;
      setDraftValues(savedValues);
      return;
    }

    if (!isFocusedRef.current) {
      setDraftValues(savedValues);
    }
  }, [release.instance_id, savedValues]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const persistField = useCallback(
    async (fieldId: number, value: string) => {
      const savedValue = savedValues[String(fieldId)] ?? "";

      if (value.length > COLLECTION_NOTE_MAX_LENGTH) {
        return;
      }

      if (value === savedValue) {
        return;
      }

      showReleaseNotesSavingToast();

      const saved = await handleSave([{ fieldId, value }], {
        closeDialog: false,
      });

      if (saved) {
        showReleaseNotesSavedToast();
      } else {
        dismissReleaseNotesSaveToast();
      }
    },
    [handleSave, savedValues],
  );

  const schedulePersist = useCallback(
    (fieldId: number, value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void persistField(fieldId, value);
      }, SAVE_DEBOUNCE_MS);
    },
    [persistField],
  );

  const handleTextFieldChange = useCallback(
    (fieldId: number, event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      const fieldKey = String(fieldId);

      setDraftValues((currentValues) => ({
        ...currentValues,
        [fieldKey]: value,
      }));
      schedulePersist(fieldId, value);
    },
    [schedulePersist],
  );

  const handleTextFieldFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleTextFieldBlur = useCallback(
    (fieldId: number) => {
      isFocusedRef.current = false;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      void persistField(fieldId, draftValues[String(fieldId)] ?? "");
    },
    [draftValues, persistField],
  );

  const handleConditionFieldChange = useCallback(
    (fieldId: number, value: string) => {
      const fieldKey = String(fieldId);

      setDraftValues((currentValues) => ({
        ...currentValues,
        [fieldKey]: value,
      }));
      void persistField(fieldId, value);
    },
    [persistField],
  );

  const sectionLabelId =
    editableFields[0] !== undefined
      ? getNoteFieldLabelId(editableFields[0].id)
      : undefined;

  return (
    <section
      {...(sectionLabelId
        ? { "aria-labelledby": sectionLabelId }
        : { "aria-label": "Release notes" })}
      className={styles.notesModalEditor}
    >
      <ReleaseNotesFormFields
        textFields={editableFields}
        conditionFields={editableConditionFields}
        values={draftValues}
        disabled={isSaving}
        layout="modal"
        onTextFieldChange={handleTextFieldChange}
        onTextFieldFocus={handleTextFieldFocus}
        onTextFieldBlur={handleTextFieldBlur}
        onConditionFieldChange={handleConditionFieldChange}
      />

      {errorMessage ? (
        <div className={styles.notesModalEditorFooter}>
          <p className={styles.notesModalEditorError} role="alert">
            {errorMessage}
          </p>
        </div>
      ) : null}
    </section>
  );
};
