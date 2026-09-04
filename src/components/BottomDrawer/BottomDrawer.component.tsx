"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import { usePlaybackPageScrollLock } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { useMounted } from "src/hooks/useMounted.hook";
import XIcon from "src/styles/icons/x-thin.svg";
import { definedProps } from "src/utils/definedProps";
import styles from "./BottomDrawer.module.css";

interface BottomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleId?: string;
  headerContent?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeButtonAriaLabel?: string;
  closeButtonPlacement?: "floating" | "header";
  chrome?: boolean;
  contentFlush?: boolean;
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
  titleId,
  headerContent,
  children,
  footer,
  closeButtonAriaLabel = "Close drawer",
  closeButtonPlacement,
  chrome = false,
  contentFlush = false,
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
  const resolvedClosePlacement =
    closeButtonPlacement ?? (chrome ? "header" : "floating");

  if (!(isOpen && mounted)) {
    return null;
  }

  const closeButton = (
    <button
      type="button"
      className={
        resolvedClosePlacement === "header"
          ? styles.headerCloseButton
          : styles.closeButton
      }
      onClick={onClose}
      aria-label={closeButtonAriaLabel}
      data-testid="fmdBottomDrawerCloseButton"
    >
      <XIcon
        className={
          resolvedClosePlacement === "header"
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
      <div
        className={classNames(styles.drawer, drawerClassName, {
          [styles.drawerChrome]: chrome,
          [styles.open]: isOpen,
          [styles.aboveMiniPlayer]: aboveMiniPlayer,
          [styles.behindMiniPlayer]: behindMiniPlayer,
          [styles.inline]: inline,
        })}
        data-testid="fmdBottomDrawer"
        {...definedProps({
          "aria-labelledby": title && titleId ? titleId : undefined,
        })}
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
          <div
            className={classNames(
              chrome ? styles.headerChrome : styles.header,
              headerClassName,
            )}
          >
            <div className={styles.headerContent}>
              {title ? (
                <h2
                  className={chrome ? styles.titleChrome : styles.title}
                  {...definedProps({ id: titleId })}
                >
                  {title}
                </h2>
              ) : null}
              {headerContent}
            </div>
            {resolvedClosePlacement === "header" ? closeButton : null}
          </div>
        )}
        <OverlayStack
          className={styles.overlayStack}
          escapeStackingContext
          popoverZIndex="calc(var(--z-10-bottom-drawer) + 1)"
        >
          <div
            className={classNames(styles.content, contentClassName, {
              [styles.contentFlush]: chrome && contentFlush,
            })}
          >
            {children}
          </div>
        </OverlayStack>
        {footer && (
          <div className={styles.footer} data-bottom-drawer-footer>
            {footer}
          </div>
        )}
      </div>
      {resolvedClosePlacement === "floating" ? closeButton : null}
    </>
  );

  if (inline) {
    return drawer;
  }

  return createPortal(drawer, document.body);
};
