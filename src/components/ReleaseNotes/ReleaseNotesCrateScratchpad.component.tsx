"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import Select from "src/components/Select/Select.component";
import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import {
  isReleaseNoteTextWithinLimit,
  type ReleaseNotesCrateFieldValues,
  releaseNotesCrateFieldSchema,
} from "src/lib/validation/releaseNotes.schemas";
import type { DiscogsCollectionField, DiscogsRelease } from "src/types";
import {
  getInitialActiveTextFieldId,
  getReleaseNotes,
  getReleaseNotesTextFieldPickerOptions,
  normalizeFieldId,
  parseReleaseNotesTextFieldPickerValue,
  RELEASE_NOTES_TEXT_FIELD_PICKER_LABEL,
  sortTextCollectionFields,
} from "src/utils/releaseNotes";
import styles from "./ReleaseNotes.module.css";
import formFieldStyles from "./ReleaseNotesFormFields.module.css";
import { useReleaseNotesEditor } from "./useReleaseNotesEditor.hook";

const SAVE_DEBOUNCE_MS = 700;

type SaveState = "idle" | "pending" | "saved";

interface ReleaseNotesCrateFieldScratchpadProps {
  field: DiscogsCollectionField;
  release: DiscogsRelease;
  savedValue: string;
  showFieldLabel: boolean;
  onDraftChange?: (value: string) => void;
  onSave: (
    values: Array<{ fieldId: number; value: string }>,
  ) => Promise<boolean>;
}

const ReleaseNotesCrateFieldScratchpad = ({
  field,
  release,
  savedValue,
  showFieldLabel,
  onDraftChange,
  onSave,
}: ReleaseNotesCrateFieldScratchpadProps) => {
  const fieldId = field.id;
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevInstanceIdRef = useRef(release.instance_id);

  const { register, reset, watch } = useForm<ReleaseNotesCrateFieldValues>({
    resolver: zodResolver(releaseNotesCrateFieldSchema),
    defaultValues: { value: savedValue },
    mode: "onChange",
  });

  const draft = watch("value");
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const notesLength = draft.length;
  const isNotesOverLimit = !isReleaseNoteTextWithinLimit(draft);
  const textareaId = `fmdReleaseNotesCrate-${release.instance_id}-${fieldId}`;
  const statusLabel =
    saveState === "pending"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : null;

  useEffect(() => {
    if (prevInstanceIdRef.current !== release.instance_id) {
      prevInstanceIdRef.current = release.instance_id;
      reset({ value: savedValue });
      setSaveState("idle");
      return;
    }

    if (!isFocusedRef.current) {
      reset({ value: savedValue });
    }
  }, [release.instance_id, reset, savedValue]);

  useEffect(() => {
    if (onDraftChange) {
      onDraftChange(draft);
    }
  }, [draft, onDraftChange]);

  const persist = useCallback(
    async (value: string) => {
      if (!isReleaseNoteTextWithinLimit(value)) {
        return;
      }

      if (value === savedValue) {
        setSaveState("idle");
        return;
      }

      setSaveState("pending");

      try {
        await onSave([{ fieldId, value }]);
        setSaveState("saved");

        if (savedTimeoutRef.current) {
          clearTimeout(savedTimeoutRef.current);
        }

        savedTimeoutRef.current = setTimeout(() => {
          setSaveState("idle");
        }, 2000);
      } catch {
        setSaveState("idle");
      }
    },
    [fieldId, onSave, savedValue],
  );

  const persistRef = useRef(persist);
  persistRef.current = persist;

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }

      void persistRef.current(draftRef.current);
    };
  }, []);

  const schedulePersist = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void persist(value);
      }, SAVE_DEBOUNCE_MS);
    },
    [persist],
  );

  const { onBlur, onChange, ...valueFieldProps } = register("value");

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      isFocusedRef.current = false;
      onBlur(event);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      void persist(event.target.value);
    },
    [onBlur, persist],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event);
      schedulePersist(event.target.value);
    },
    [onChange, schedulePersist],
  );

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  return (
    <div className={styles.notesCrateScratchpadField}>
      {showFieldLabel && field.name ? (
        <label
          className={styles.notesCrateScratchpadLabel}
          htmlFor={textareaId}
        >
          {field.name}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={classNames(
          styles.notesCrateScratchpadInput,
          isNotesOverLimit && styles.notesCrateScratchpadInputInvalid,
        )}
        maxLength={COLLECTION_NOTE_MAX_LENGTH}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="Add notes for this release"
        rows={2}
        aria-label={field.name || "Release notes"}
        aria-describedby={`${textareaId}-length`}
        aria-invalid={isNotesOverLimit ? true : undefined}
        {...valueFieldProps}
        data-1p-ignore
      />
      <div className={styles.notesCrateScratchpadFooter}>
        <div className={styles.notesCrateScratchpadFooterTrailing}>
          {statusLabel ? (
            <p className={styles.notesCrateScratchpadStatus} aria-live="polite">
              {statusLabel}
            </p>
          ) : null}
          <p
            id={`${textareaId}-length`}
            className={classNames(
              styles.notesCrateScratchpadCount,
              isNotesOverLimit && styles.notesCrateScratchpadCountLimit,
            )}
          >
            {notesLength} / {COLLECTION_NOTE_MAX_LENGTH}
          </p>
        </div>
      </div>
    </div>
  );
};

interface ReleaseNotesCrateScratchpadEditorProps {
  editableFields: DiscogsCollectionField[];
  errorMessage?: string | null;
  release: DiscogsRelease;
  savedValuesByFieldId: Map<number, string>;
  onSave: (
    values: Array<{ fieldId: number; value: string }>,
  ) => Promise<boolean>;
}

const ReleaseNotesCrateScratchpadEditor = ({
  editableFields,
  errorMessage,
  release,
  savedValuesByFieldId,
  onSave,
}: ReleaseNotesCrateScratchpadEditorProps) => {
  const sortedEditableFields = useMemo(
    () => sortTextCollectionFields(editableFields),
    [editableFields],
  );
  const savedValuesRecord = useMemo(() => {
    return Object.fromEntries(
      sortedEditableFields.map((field) => [
        String(field.id),
        savedValuesByFieldId.get(field.id) ?? "",
      ]),
    );
  }, [savedValuesByFieldId, sortedEditableFields]);
  const savedValuesRecordRef = useRef(savedValuesRecord);
  savedValuesRecordRef.current = savedValuesRecord;

  const hasMultipleTextFields = sortedEditableFields.length > 1;
  const prevInstanceIdRef = useRef(release.instance_id);
  const [activeFieldDraft, setActiveFieldDraft] = useState("");
  const [activeTextFieldId, setActiveTextFieldId] = useState(() =>
    getInitialActiveTextFieldId(sortedEditableFields, savedValuesRecord),
  );

  useEffect(() => {
    setActiveTextFieldId((currentFieldId) => {
      if (
        currentFieldId !== undefined &&
        sortedEditableFields.some((field) => field.id === currentFieldId)
      ) {
        return currentFieldId;
      }

      return getInitialActiveTextFieldId(
        sortedEditableFields,
        savedValuesRecordRef.current,
      );
    });
  }, [sortedEditableFields]);

  useEffect(() => {
    if (prevInstanceIdRef.current === release.instance_id) {
      return;
    }

    prevInstanceIdRef.current = release.instance_id;
    setActiveTextFieldId(
      getInitialActiveTextFieldId(sortedEditableFields, savedValuesRecord),
    );
  }, [release.instance_id, savedValuesRecord, sortedEditableFields]);

  const textFieldPickerValues = useMemo(() => {
    return Object.fromEntries(
      sortedEditableFields.map((field) => {
        const fieldKey = String(field.id);
        const value =
          field.id === activeTextFieldId
            ? activeFieldDraft
            : (savedValuesByFieldId.get(field.id) ?? "");

        return [fieldKey, value] as const;
      }),
    );
  }, [
    activeFieldDraft,
    activeTextFieldId,
    savedValuesByFieldId,
    sortedEditableFields,
  ]);

  const textFieldPickerOptions = useMemo(
    () =>
      getReleaseNotesTextFieldPickerOptions(
        sortedEditableFields,
        textFieldPickerValues,
      ),
    [sortedEditableFields, textFieldPickerValues],
  );

  const activeTextField =
    sortedEditableFields.find((field) => field.id === activeTextFieldId) ??
    sortedEditableFields[0];
  const textFieldPickerValue = activeTextFieldId ?? sortedEditableFields[0]?.id;

  return (
    <div
      className={classNames(styles.notes, styles.notesCrateScratchpad)}
      data-testid="fmdReleaseNotes"
    >
      {hasMultipleTextFields && textFieldPickerValue !== undefined ? (
        <Select
          className={classNames(
            formFieldStyles.conditionSelect,
            styles.notesCrateScratchpadFieldPicker,
          )}
          label={RELEASE_NOTES_TEXT_FIELD_PICKER_LABEL}
          showLabel
          options={textFieldPickerOptions}
          value={String(textFieldPickerValue)}
          onChange={(value) => {
            const nextFieldId = parseReleaseNotesTextFieldPickerValue(value);

            if (nextFieldId !== null) {
              setActiveTextFieldId(nextFieldId);
            }
          }}
        />
      ) : null}
      {activeTextField ? (
        <ReleaseNotesCrateFieldScratchpad
          key={`${release.instance_id}-${activeTextField.id}`}
          release={release}
          field={activeTextField}
          savedValue={savedValuesByFieldId.get(activeTextField.id) ?? ""}
          showFieldLabel={!hasMultipleTextFields}
          {...(hasMultipleTextFields
            ? { onDraftChange: setActiveFieldDraft }
            : {})}
          onSave={onSave}
        />
      ) : null}
      {errorMessage ? (
        <p className={styles.notesCrateScratchpadError} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export const ReleaseNotesCrateScratchpad = ({
  release,
}: {
  release: DiscogsRelease;
}) => {
  const {
    canEdit,
    cardDisplayedNotes,
    editableFields,
    errorMessage,
    handleSave,
  } = useReleaseNotesEditor(release);

  const savedValuesByFieldId = useMemo(() => {
    const notes = getReleaseNotes(release);

    return new Map(
      editableFields.map((field) => {
        const existingNote = notes.find(
          (note) => normalizeFieldId(note.field_id) === field.id,
        );

        return [field.id, existingNote?.value ?? ""] as const;
      }),
    );
  }, [editableFields, release]);

  if (canEdit) {
    return (
      <ReleaseNotesCrateScratchpadEditor
        editableFields={editableFields}
        errorMessage={errorMessage}
        release={release}
        savedValuesByFieldId={savedValuesByFieldId}
        onSave={handleSave}
      />
    );
  }

  if (cardDisplayedNotes.length === 0) {
    return (
      <div
        className={classNames(
          styles.notes,
          styles.notesCrate,
          styles.notesCrateEmpty,
        )}
        data-testid="fmdReleaseNotes"
      >
        <span className={styles.emptyNotes}>No notes</span>
      </div>
    );
  }

  return (
    <div
      className={classNames(
        styles.notes,
        styles.notesCrate,
        styles.notesCrateFilled,
      )}
      data-testid="fmdReleaseNotes"
    >
      {cardDisplayedNotes.map((note) => (
        <div
          className={styles.noteRow}
          key={`${release.instance_id}-${note.fieldId}`}
        >
          <p className={styles.noteContent}>{note.value}</p>
        </div>
      ))}
    </div>
  );
};
