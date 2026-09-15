"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  buildReleaseNotesFormSchema,
  isReleaseNoteTextWithinLimit,
  type ReleaseNotesFormValues,
} from "src/lib/validation/releaseNotes.schemas";
import { zodFormResolver } from "src/lib/validation/zodFormResolver";
import type { DiscogsRelease } from "src/types";
import { getReleaseNotes, normalizeFieldId } from "src/utils/releaseNotes";
import styles from "./ReleaseNotes.module.css";
import { useReleaseNotesEditorContext } from "./ReleaseNotesEditor.context";
import {
  getNoteFieldLabelId,
  ReleaseNotesFormFields,
  type ReleaseNotesTextFieldSaveStatus,
} from "./ReleaseNotesFormFields.component";
import {
  dismissReleaseNotesSaveToast,
  RELEASE_NOTES_SAVED_TOAST_DURATION_MS,
  showReleaseNotesSavedToast,
  showReleaseNotesSavingToast,
} from "./releaseNotesSaveToast";

const SAVE_DEBOUNCE_MS = 700;

const getFieldValues = (
  release: DiscogsRelease,
  fieldIds: number[],
): ReleaseNotesFormValues => {
  const notes = getReleaseNotes(release);
  const values: ReleaseNotesFormValues = {};

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

  const noteFormSchema = useMemo(
    () => buildReleaseNotesFormSchema(editableFields.map((field) => field.id)),
    [editableFields],
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistGenerationRef = useRef(0);
  const [pendingFieldId, setPendingFieldId] = useState<number | null>(null);
  const [savedFlashFieldId, setSavedFlashFieldId] = useState<number | null>(
    null,
  );

  const {
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = useForm<ReleaseNotesFormValues>({
    resolver: zodFormResolver(noteFormSchema),
    defaultValues: savedValues,
    mode: "onChange",
  });

  const formValues = watch();

  const textFieldSaveStatus = useMemo(() => {
    const status: Record<string, ReleaseNotesTextFieldSaveStatus> = {};

    for (const field of editableFields) {
      const fieldKey = String(field.id);

      if (pendingFieldId === field.id) {
        status[fieldKey] = "pending";
      } else if (savedFlashFieldId === field.id) {
        status[fieldKey] = "saved";
      }
    }

    return status;
  }, [editableFields, pendingFieldId, savedFlashFieldId]);

  const textFieldErrors = useMemo(() => {
    const fieldErrors: Record<string, { message?: string }> = {};

    for (const field of editableFields) {
      const fieldKey = String(field.id);
      const message = errors[fieldKey]?.message;

      if (typeof message === "string") {
        fieldErrors[fieldKey] = { message };
      }
    }

    return fieldErrors;
  }, [editableFields, errors]);

  useEffect(() => {
    return () => {
      persistGenerationRef.current += 1;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      dismissReleaseNotesSaveToast();
    };
  }, []);

  useEffect(() => {
    if (savedFlashFieldId === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setSavedFlashFieldId(null);
    }, RELEASE_NOTES_SAVED_TOAST_DURATION_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [savedFlashFieldId]);

  const persistField = useCallback(
    async (fieldId: number, value: string) => {
      const fieldKey = String(fieldId);
      const savedValue = savedValues[fieldKey] ?? "";
      const isTextField = editableFields.some((field) => field.id === fieldId);

      if (isTextField && !isReleaseNoteTextWithinLimit(value)) {
        return;
      }

      if (value === savedValue) {
        return;
      }

      if (pendingFieldId === fieldId && isSaving) {
        return;
      }

      const generation = persistGenerationRef.current;

      if (isTextField) {
        setPendingFieldId(fieldId);
      } else {
        showReleaseNotesSavingToast();
      }

      try {
        const saved = await handleSave([{ fieldId, value }], {
          closeDialog: false,
        });

        if (generation !== persistGenerationRef.current) {
          return;
        }

        if (saved) {
          showReleaseNotesSavedToast();

          if (isTextField) {
            setSavedFlashFieldId(fieldId);
          }
        } else {
          dismissReleaseNotesSaveToast();
        }
      } catch {
        dismissReleaseNotesSaveToast();
      } finally {
        if (generation === persistGenerationRef.current) {
          setPendingFieldId(null);
        }
      }
    },
    [editableFields, handleSave, isSaving, pendingFieldId, savedValues],
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

      setValue(String(fieldId), value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      schedulePersist(fieldId, value);
    },
    [schedulePersist, setValue],
  );

  const handleTextFieldBlur = useCallback(
    (fieldId: number) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      void persistField(fieldId, getValues()[String(fieldId)] ?? "");
    },
    [getValues, persistField],
  );

  const handleConditionFieldChange = useCallback(
    (fieldId: number, value: string) => {
      const fieldKey = String(fieldId);

      setValue(fieldKey, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      void persistField(fieldId, value);
    },
    [persistField, setValue],
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
        values={formValues}
        layout="modal"
        textFieldErrors={textFieldErrors}
        textFieldSaveStatus={textFieldSaveStatus}
        onTextFieldChange={handleTextFieldChange}
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
