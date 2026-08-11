"use client";

import type { ReactNode } from "react";
import { AppDialog } from "src/components/shared/AppDialog/AppDialog.component";
import { definedProps } from "src/utils/definedProps";
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
  return (
    <AppDialog
      open={isOpen}
      onClose={onClose}
      panelClassName={styles.modal}
      backdropVariant="modal"
      {...definedProps({
        testId,
        ariaLabelledBy,
        ariaDescribedBy,
      })}
    >
      <div className={styles.header}>{header}</div>
      <div className={styles.content}>{children}</div>
    </AppDialog>
  );
}
