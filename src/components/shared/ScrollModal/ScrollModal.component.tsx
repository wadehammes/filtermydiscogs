"use client";

import { type ReactNode, useCallback } from "react";
import styles from "./ScrollModal.module.css";

interface ScrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  testId?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  header: ReactNode;
  children: ReactNode;
}

export function ScrollModal({
  isOpen,
  onClose,
  testId,
  ariaLabelledBy,
  ariaDescribedBy,
  header,
  children,
}: ScrollModalProps) {
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-describedby={ariaDescribedBy}
      aria-labelledby={ariaLabelledBy}
      aria-modal="true"
      className={styles.backdrop}
      data-testid={testId}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
    >
      <div className={styles.modal}>
        <div className={styles.header}>{header}</div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
