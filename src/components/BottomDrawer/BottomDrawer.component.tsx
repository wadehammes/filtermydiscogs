import classNames from "classnames";
import type { ReactNode } from "react";
import XIcon from "src/styles/icons/x-thin.svg";
import styles from "./BottomDrawer.module.css";

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  headerContent?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeButtonAriaLabel?: string;
  dataAttribute?: string;
  aboveMiniPlayer?: boolean;
}

export const BottomDrawer = ({
  isOpen,
  onClose,
  title,
  headerContent,
  children,
  footer,
  closeButtonAriaLabel = "Close drawer",
  dataAttribute,
  aboveMiniPlayer = false,
}: BottomDrawerProps) => {
  if (!isOpen) return null;

  return (
    <>
      <button
        type="button"
        className={classNames(styles.overlay, {
          [styles.open]: isOpen,
        })}
        onClick={onClose}
        aria-label="Close drawer overlay"
        {...(dataAttribute ? { [dataAttribute]: "true" } : {})}
      />
      {isOpen && (
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={closeButtonAriaLabel}
        >
          <XIcon className={styles.closeIcon} aria-hidden />
        </button>
      )}
      <div
        className={classNames(styles.drawer, {
          [styles.open]: isOpen,
          [styles.aboveMiniPlayer]: aboveMiniPlayer,
        })}
        data-testid="fmdBottomDrawer"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {(title || headerContent) && (
          <div className={styles.header}>
            <div className={styles.headerContent}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {headerContent}
            </div>
          </div>
        )}
        <div className={styles.content}>{children}</div>
        {footer && (
          <div className={styles.footer} data-bottom-drawer-footer>
            {footer}
          </div>
        )}
      </div>
    </>
  );
};
