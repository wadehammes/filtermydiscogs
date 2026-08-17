"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import { zodResolver } from "@hookform/resolvers/zod";
import classNames from "classnames";
import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useForm } from "react-hook-form";
import { CRATE_MARKER_MAX_LENGTH } from "src/constants/crate";
import {
  type CrateSetMarkerLabelValues,
  crateSetMarkerLabelSchema,
} from "src/lib/validation/crate.schemas";
import GripVerticalIcon from "src/styles/icons/grip-vertical-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import type { CrateLayoutMarkerItem } from "src/types/crate.types";
import styles from "./CrateSetMarkerRow.module.css";

interface CrateSetMarkerRowProps {
  marker: CrateLayoutMarkerItem;
  readOnly?: boolean;
  fullWidth?: boolean;
  className?: string;
  autoFocus?: boolean;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: object;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  isDragging?: boolean;
  onLabelChange?: (label: string) => void;
  onDelete?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export const CrateSetMarkerRow = ({
  marker,
  readOnly = false,
  fullWidth = false,
  className,
  autoFocus = false,
  dragHandleAttributes,
  dragHandleListeners,
  setNodeRef,
  style,
  isDragging = false,
  onLabelChange,
  onDelete,
  inputRef,
}: CrateSetMarkerRowProps) => {
  const localInputRef = useRef<HTMLInputElement>(null);
  const isFocusedRef = useRef(false);

  const { register, reset } = useForm<CrateSetMarkerLabelValues>({
    resolver: zodResolver(crateSetMarkerLabelSchema),
    defaultValues: { label: marker.label },
    mode: "onChange",
  });

  useEffect(() => {
    if (!isFocusedRef.current) {
      reset({ label: marker.label });
    }
  }, [marker.label, reset]);

  useEffect(() => {
    if (autoFocus) {
      const focusTarget = inputRef?.current ?? localInputRef.current;
      focusTarget?.focus();
      focusTarget?.select();
    }
  }, [autoFocus, inputRef]);

  const {
    onBlur,
    onChange,
    ref: registerRef,
    ...labelFieldProps
  } = register("label");

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      onBlur(event);

      const trimmedLabel = event.target.value.trim();

      if (trimmedLabel.length === 0) {
        reset({ label: marker.label });
        return;
      }

      if (trimmedLabel.length > CRATE_MARKER_MAX_LENGTH) {
        reset({ label: marker.label });
        return;
      }

      reset({ label: trimmedLabel });
      onLabelChange?.(trimmedLabel);
    },
    [marker.label, onBlur, onLabelChange, reset],
  );

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  if (readOnly) {
    return (
      <div
        className={classNames(styles.readOnlyMarker, {
          [styles.readOnlyMarkerFullWidth]: fullWidth,
        })}
        style={style}
      >
        <span className={styles.rule} aria-hidden="true" />
        <span className={styles.readOnlyLabel}>{marker.label}</span>
        <span className={styles.rule} aria-hidden="true" />
      </div>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={classNames(styles.markerRow, className, {
        [styles.markerRowFullWidth]: fullWidth,
        [styles.markerRowDragging]: isDragging,
      })}
    >
      <button
        type="button"
        className={styles.dragHandle}
        aria-label="Reorder"
        {...(dragHandleAttributes ?? {})}
        {...(dragHandleListeners ?? {})}
      >
        <GripVerticalIcon
          className={styles.dragHandleIcon}
          aria-hidden="true"
        />
      </button>
      <div className={styles.markerContent}>
        <span className={styles.rule} aria-hidden="true" />
        <input
          ref={(element) => {
            registerRef(element);
            localInputRef.current = element;
            if (inputRef && "current" in inputRef) {
              inputRef.current = element;
            }
          }}
          type="text"
          className={styles.labelInput}
          maxLength={CRATE_MARKER_MAX_LENGTH}
          aria-label="Section label"
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...labelFieldProps}
        />
        <span className={styles.rule} aria-hidden="true" />
      </div>
      <button
        type="button"
        className={styles.deleteButton}
        aria-label={`Remove section ${marker.label}`}
        onClick={onDelete}
      >
        <TrashOpenIcon className={styles.deleteIcon} aria-hidden="true" />
      </button>
    </li>
  );
};
