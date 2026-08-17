"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  buildReleaseNotesFormSchema,
  isReleaseNoteTextWithinLimit,
  type ReleaseNotesFormValues,
} from "src/lib/validation/releaseNotes.schemas";
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
  const isFocusedRef = useRef(false);
  const prevInstanceIdRef = useRef(release.instance_id);

  const {
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ReleaseNotesFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: savedValues,
    mode: "onChange",
  });

  const formValues = watch();

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
    if (prevInstanceIdRef.current !== release.instance_id) {
      prevInstanceIdRef.current = release.instance_id;
      reset(savedValues);
      return;
    }

    if (!isFocusedRef.current) {
      reset(savedValues);
    }
  }, [release.instance_id, reset, savedValues]);

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
      const isTextField = editableFields.some((field) => field.id === fieldId);

      if (isTextField && !isReleaseNoteTextWithinLimit(value)) {
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
    [editableFields, handleSave, savedValues],
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

      setValue(fieldKey, value, {
        shouldDirty: true,
        shouldValidate: true,
      });
      schedulePersist(fieldId, value);
    },
    [schedulePersist, setValue],
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

      void persistField(fieldId, formValues[String(fieldId)] ?? "");
    },
    [formValues, persistField],
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
        disabled={isSaving}
        layout="modal"
        textFieldErrors={textFieldErrors}
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
