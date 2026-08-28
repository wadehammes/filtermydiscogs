"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePlaybackPageScrollLock } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { useMounted } from "src/hooks/useMounted.hook";
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
  closeButtonPlacement?: "floating" | "header";
  dataAttribute?: string;
  drawerClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  aboveMiniPlayer?: boolean;
  behindMiniPlayer?: boolean;
  hideOverlay?: boolean;
  inline?: boolean;
}

export const BottomDrawer = ({
  isOpen,
  onClose,
  title,
  headerContent,
  children,
  footer,
  closeButtonAriaLabel = "Close drawer",
  closeButtonPlacement = "floating",
  dataAttribute,
  drawerClassName,
  headerClassName,
  contentClassName,
  aboveMiniPlayer = false,
  behindMiniPlayer = false,
  hideOverlay = false,
  inline = false,
}: BottomDrawerProps) => {
  usePlaybackPageScrollLock(isOpen && !hideOverlay && !inline);
  const mounted = useMounted();

  if (!(isOpen && mounted)) {
    return null;
  }

  const closeButton = (
    <button
      type="button"
      className={
        closeButtonPlacement === "header"
          ? styles.headerCloseButton
          : styles.closeButton
      }
      onClick={onClose}
      aria-label={closeButtonAriaLabel}
      data-testid="fmdBottomDrawerCloseButton"
    >
      <XIcon
        className={
          closeButtonPlacement === "header"
            ? styles.headerCloseIcon
            : styles.closeIcon
        }
        aria-hidden
      />
    </button>
  );

  const drawer = (
    <>
      {hideOverlay || inline ? null : (
        <button
          type="button"
          className={classNames(styles.overlay, {
            [styles.open]: isOpen,
            [styles.aboveMiniPlayer]: aboveMiniPlayer,
            [styles.behindMiniPlayer]: behindMiniPlayer,
          })}
          onClick={onClose}
          aria-label="Close drawer overlay"
          {...(dataAttribute ? { [dataAttribute]: "true" } : {})}
        />
      )}
      {closeButtonPlacement === "floating" ? closeButton : null}
      <div
        className={classNames(styles.drawer, drawerClassName, {
          [styles.open]: isOpen,
          [styles.aboveMiniPlayer]: aboveMiniPlayer,
          [styles.behindMiniPlayer]: behindMiniPlayer,
          [styles.inline]: inline,
        })}
        data-testid="fmdBottomDrawer"
        {...((hideOverlay || inline) && dataAttribute
          ? { [dataAttribute]: "true" }
          : {})}
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
        aria-modal={hideOverlay || inline ? "false" : "true"}
        tabIndex={-1}
      >
        {(title || headerContent) && (
          <div className={classNames(styles.header, headerClassName)}>
            <div className={styles.headerContent}>
              {title && <h2 className={styles.title}>{title}</h2>}
              {headerContent}
            </div>
            {closeButtonPlacement === "header" ? closeButton : null}
          </div>
        )}
        <div className={classNames(styles.content, contentClassName)}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer} data-bottom-drawer-footer>
            {footer}
          </div>
        )}
      </div>
    </>
  );

  if (inline) {
    return drawer;
  }

  return createPortal(drawer, document.body);
};
