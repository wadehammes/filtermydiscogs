"use client";

import classNames from "classnames";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { BottomDrawerCloseButton } from "src/components/BottomDrawer/BottomDrawerCloseButton.component";
import { BottomDrawerOverlay } from "src/components/BottomDrawer/BottomDrawerOverlay.component";
import { BottomDrawerPanel } from "src/components/BottomDrawer/BottomDrawerPanel.component";
import { BrowserOnly } from "src/components/BrowserOnly/BrowserOnly.component";
import { usePlaybackPageScrollLock } from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import { ViewTransitionShell } from "src/components/ViewTransitionShell/ViewTransitionShell.component";
import { definedProps } from "src/utils/definedProps";
import styles from "./BottomDrawer.module.css";

const BottomDrawerBodyPortal = ({ children }: { children: ReactNode }) =>
  createPortal(children, document.body);

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
  shellClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  aboveMiniPlayer?: boolean;
  behindMiniPlayer?: boolean;
  hideOverlay?: boolean;
  inline?: boolean;
  inlineAlignEnd?: boolean;
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
  shellClassName,
  headerClassName,
  contentClassName,
  aboveMiniPlayer = false,
  behindMiniPlayer = false,
  hideOverlay = false,
  inline = false,
  inlineAlignEnd = false,
}: BottomDrawerProps) => {
  usePlaybackPageScrollLock(isOpen && !hideOverlay && !inline);
  const resolvedClosePlacement =
    closeButtonPlacement ?? (chrome ? "header" : "floating");
  const hasHeader = Boolean(title || headerContent);
  const usesFloatingClose = resolvedClosePlacement === "floating";

  if (!isOpen) {
    return null;
  }

  const drawer = (
    <>
      {hideOverlay || inline ? null : (
        <BottomDrawerOverlay
          isOpen={isOpen}
          aboveMiniPlayer={aboveMiniPlayer}
          behindMiniPlayer={behindMiniPlayer}
          {...(dataAttribute ? { dataAttribute } : {})}
          onClose={onClose}
        />
      )}
      <div
        className={classNames(
          styles.drawerShell,
          {
            [styles.open]: isOpen,
            [styles.aboveMiniPlayer]: aboveMiniPlayer,
            [styles.behindMiniPlayer]: behindMiniPlayer,
            [styles.drawerShellWithFloatingClose]: usesFloatingClose,
            [styles.inline]: inline,
            [styles.inlineAlignEnd]: inline && inlineAlignEnd,
          },
          shellClassName,
        )}
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
        {usesFloatingClose ? (
          <BottomDrawerCloseButton
            placement="floating"
            ariaLabel={closeButtonAriaLabel}
            onClose={onClose}
          />
        ) : null}
        <BottomDrawerPanel
          chrome={chrome}
          {...definedProps({
            drawerClassName,
            headerClassName,
            title,
            titleId,
            headerContent,
            contentClassName,
            footer,
          })}
          hasHeader={hasHeader}
          closePlacement={resolvedClosePlacement}
          closeButtonAriaLabel={closeButtonAriaLabel}
          contentFlush={contentFlush}
          onClose={onClose}
        >
          {children}
        </BottomDrawerPanel>
      </div>
    </>
  );

  const drawerContent = (
    <ViewTransitionShell mode="mount">{drawer}</ViewTransitionShell>
  );

  if (inline) {
    return <BrowserOnly>{drawerContent}</BrowserOnly>;
  }

  return (
    <BrowserOnly>
      <BottomDrawerBodyPortal>{drawerContent}</BottomDrawerBodyPortal>
    </BrowserOnly>
  );
};
