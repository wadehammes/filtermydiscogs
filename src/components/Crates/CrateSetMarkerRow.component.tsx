"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import classNames from "classnames";
import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { CRATE_MARKER_MAX_LENGTH } from "src/constants/crate";
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
  const [label, setLabel] = useState(marker.label);
  const localInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabel(marker.label);
  }, [marker.label]);

  useEffect(() => {
    if (autoFocus) {
      const focusTarget = inputRef?.current ?? localInputRef.current;
      focusTarget?.focus();
      focusTarget?.select();
    }
  }, [autoFocus, inputRef]);

  const handleLabelChange = (nextLabel: string) => {
    setLabel(nextLabel);
  };

  const handleBlur = () => {
    const trimmedLabel = label.trim();

    if (trimmedLabel.length === 0) {
      setLabel(marker.label);
      return;
    }

    setLabel(trimmedLabel);

    if (trimmedLabel !== marker.label) {
      onLabelChange?.(trimmedLabel);
    }
  };

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
          ref={inputRef ?? localInputRef}
          type="text"
          className={styles.labelInput}
          value={label}
          maxLength={CRATE_MARKER_MAX_LENGTH}
          aria-label="Section label"
          onChange={(event) => handleLabelChange(event.target.value)}
          onBlur={handleBlur}
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
