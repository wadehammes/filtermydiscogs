"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { BottomDrawerCloseButton } from "src/components/BottomDrawer/BottomDrawerCloseButton.component";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import { definedProps } from "src/utils/definedProps";
import styles from "./BottomDrawer.module.css";

interface BottomDrawerPanelProps {
  chrome: boolean;
  drawerClassName?: string;
  hasHeader: boolean;
  headerClassName?: string;
  title?: string;
  titleId?: string;
  headerContent?: ReactNode;
  closePlacement: "floating" | "header";
  closeButtonAriaLabel: string;
  contentClassName?: string;
  contentFlush: boolean;
  footer?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

export const BottomDrawerPanel = ({
  chrome,
  drawerClassName,
  hasHeader,
  headerClassName,
  title,
  titleId,
  headerContent,
  closePlacement,
  closeButtonAriaLabel,
  contentClassName,
  contentFlush,
  footer,
  onClose,
  children,
}: BottomDrawerPanelProps) => (
  <div
    className={classNames(styles.drawer, drawerClassName, {
      [styles.drawerChrome]: chrome,
    })}
  >
    {hasHeader ? (
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
        {closePlacement === "header" ? (
          <BottomDrawerCloseButton
            placement="header"
            ariaLabel={closeButtonAriaLabel}
            onClose={onClose}
          />
        ) : null}
      </div>
    ) : null}
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
    {footer ? (
      <div className={styles.footer} data-bottom-drawer-footer>
        {footer}
      </div>
    ) : null}
  </div>
);
