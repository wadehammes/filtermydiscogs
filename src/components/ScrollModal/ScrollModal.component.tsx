"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { AppDialog } from "src/components/AppDialog/AppDialog.component";
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
  panelClassName?: string;
  contentClassName?: string;
  aside?: ReactNode;
  asideClassName?: string;
  toolbar?: ReactNode;
}

export function ScrollModal({
  isOpen,
  onClose,
  testId,
  ariaLabelledBy,
  ariaDescribedBy,
  header,
  children,
  panelClassName,
  contentClassName,
  aside,
  asideClassName,
  toolbar,
}: ScrollModalProps) {
  const hasAside = aside != null;

  return (
    <AppDialog
      open={isOpen}
      onClose={onClose}
      panelClassName={classNames(styles.modal, panelClassName)}
      backdropVariant="modal"
      {...definedProps({
        testId,
        ariaLabelledBy,
        ariaDescribedBy,
      })}
    >
      {hasAside ? (
        <div className={styles.splitLayout}>
          {toolbar ? (
            <div className={styles.splitToolbar}>{toolbar}</div>
          ) : null}
          <div className={styles.splitShell}>
            <div className={styles.splitMain}>
              <div className={styles.header}>{header}</div>
              <div
                className={classNames(
                  styles.content,
                  styles.splitContent,
                  contentClassName,
                )}
              >
                {children}
              </div>
            </div>
            <div className={classNames(styles.aside, asideClassName)}>
              {aside}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.header}>{header}</div>
          <div className={classNames(styles.content, contentClassName)}>
            {children}
          </div>
        </>
      )}
    </AppDialog>
  );
}
