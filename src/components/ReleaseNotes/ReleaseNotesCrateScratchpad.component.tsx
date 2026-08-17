"use client";

import classNames from "classnames";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COLLECTION_NOTE_MAX_LENGTH } from "src/constants/collection";
import type { DiscogsCollectionField, DiscogsRelease } from "src/types";
import { getReleaseNotes, normalizeFieldId } from "src/utils/releaseNotes";
import styles from "./ReleaseNotes.module.css";
import { useReleaseNotesEditor } from "./useReleaseNotesEditor.hook";

const SAVE_DEBOUNCE_MS = 700;

type SaveState = "idle" | "pending" | "saved";

interface ReleaseNotesCrateFieldScratchpadProps {
  field: DiscogsCollectionField;
  release: DiscogsRelease;
  savedValue: string;
  showFieldLabel: boolean;
  onSave: (
    values: Array<{ fieldId: number; value: string }>,
  ) => Promise<boolean>;
}

const ReleaseNotesCrateFieldScratchpad = ({
  field,
  release,
  savedValue,
  showFieldLabel,
  onSave,
}: ReleaseNotesCrateFieldScratchpadProps) => {
  const fieldId = field.id;
  const [draft, setDraft] = useState(savedValue);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevInstanceIdRef = useRef(release.instance_id);

  useEffect(() => {
    if (prevInstanceIdRef.current !== release.instance_id) {
      prevInstanceIdRef.current = release.instance_id;
      setDraft(savedValue);
      setSaveState("idle");
      return;
    }

    if (!isFocusedRef.current) {
      setDraft(savedValue);
    }
  }, [release.instance_id, savedValue]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  const persist = useCallback(
    async (value: string) => {
      if (value.length > COLLECTION_NOTE_MAX_LENGTH) {
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

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setDraft(value);
      schedulePersist(value);
    },
    [schedulePersist],
  );

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    void persist(draft);
  }, [draft, persist]);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const notesLength = draft.length;
  const isNotesOverLimit = notesLength > COLLECTION_NOTE_MAX_LENGTH;
  const textareaId = `fmdReleaseNotesCrate-${release.instance_id}-${fieldId}`;
  const statusLabel =
    saveState === "pending"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : null;

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
        value={draft}
        aria-label={field.name || "Release notes"}
        aria-describedby={`${textareaId}-length`}
        aria-invalid={isNotesOverLimit ? true : undefined}
      />
      <div className={styles.notesCrateScratchpadFooter}>
        {statusLabel ? (
          <p className={styles.notesCrateScratchpadStatus} aria-live="polite">
            {statusLabel}
          </p>
        ) : (
          <span aria-hidden />
        )}
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
    const showFieldLabel = editableFields.length > 1;

    return (
      <div
        className={classNames(styles.notes, styles.notesCrateScratchpad)}
        data-testid="fmdReleaseNotes"
      >
        {editableFields.map((field) => (
          <ReleaseNotesCrateFieldScratchpad
            key={`${release.instance_id}-${field.id}`}
            release={release}
            field={field}
            savedValue={savedValuesByFieldId.get(field.id) ?? ""}
            showFieldLabel={showFieldLabel}
            onSave={handleSave}
          />
        ))}
        {errorMessage ? (
          <p className={styles.notesCrateScratchpadError} role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
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
