"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CRATE_NOTES_MAX_LENGTH } from "src/constants/crate";
import {
  type CrateNotesScratchpadValues,
  crateNotesScratchpadSchema,
} from "src/lib/validation/crate.schemas";
import styles from "./CrateSetNotesScratchpad.module.css";

export const CRATE_SET_NOTES_SCRATCHPAD_ID = "fmdCrateSetNotesScratchpad";

const SAVE_DEBOUNCE_MS = 700;

type SaveState = "idle" | "pending" | "saved";

interface CrateSetNotesScratchpadProps {
  className?: string | undefined;
  variant?: "default" | "panel" | "drawer";
}

export const CrateSetNotesScratchpad = ({
  className,
  variant = "default",
}: CrateSetNotesScratchpadProps) => {
  const { activeCrateId, crateNotes, handleSaveCrateNotes } =
    useCrateDrawerContext();

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const prevCrateIdRef = useRef(activeCrateId);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { register, reset, watch } = useForm<CrateNotesScratchpadValues>({
    resolver: zodResolver(crateNotesScratchpadSchema),
    defaultValues: { notes: crateNotes },
    mode: "onChange",
  });

  const draft = watch("notes");

  useEffect(() => {
    if (prevCrateIdRef.current !== activeCrateId) {
      prevCrateIdRef.current = activeCrateId;
      reset({ notes: crateNotes });
      setSaveState("idle");
      return;
    }

    if (!isFocusedRef.current) {
      reset({ notes: crateNotes });
    }
  }, [activeCrateId, crateNotes, reset]);

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
      if (value.length > CRATE_NOTES_MAX_LENGTH) {
        return;
      }

      setSaveState("pending");

      try {
        await handleSaveCrateNotes(value);
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
    [handleSaveCrateNotes],
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

  const { onBlur, onChange, ...notesFieldProps } = register("notes");

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      isFocusedRef.current = false;
      onBlur(event);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      void persist(draft);
    },
    [draft, onBlur, persist],
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

  const notesLength = draft.length;
  const isNotesOverLimit = notesLength > CRATE_NOTES_MAX_LENGTH;
  const isDisabled = !activeCrateId;
  const textareaRows = variant === "drawer" ? 3 : 4;
  const statusLabel =
    saveState === "pending"
      ? "Saving…"
      : saveState === "saved"
        ? "Saved"
        : null;

  return (
    <section
      className={classNames(styles.section, className, {
        [styles.sectionInPanel]: variant === "panel",
        [styles.sectionInDrawer]: variant === "drawer",
      })}
      data-testid="fmdCrateSetNotesScratchpad"
    >
      <textarea
        id={CRATE_SET_NOTES_SCRATCHPAD_ID}
        className={classNames(
          variant === "panel"
            ? styles.textareaPanel
            : variant === "drawer"
              ? styles.textareaDrawer
              : styles.textarea,
          isNotesOverLimit && styles.textareaInvalid,
        )}
        disabled={isDisabled}
        maxLength={CRATE_NOTES_MAX_LENGTH}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        placeholder="Add set notes for this gig"
        rows={textareaRows}
        aria-label="Set notes"
        aria-describedby="crate-set-notes-length"
        aria-invalid={isNotesOverLimit ? true : undefined}
        {...notesFieldProps}
      />
      <div className={styles.footer}>
        {statusLabel ? (
          <p className={styles.status} aria-live="polite">
            {statusLabel}
          </p>
        ) : (
          <span aria-hidden />
        )}
        <p
          id="crate-set-notes-length"
          className={classNames(
            styles.charCount,
            isNotesOverLimit && styles.charCountLimit,
          )}
        >
          {notesLength} / {CRATE_NOTES_MAX_LENGTH}
        </p>
      </div>
    </section>
  );
};
