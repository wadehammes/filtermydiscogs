"use client";

import { Dialog } from "@base-ui/react/dialog";
import classNames from "classnames";
import { type ReactNode, useCallback, useLayoutEffect, useRef } from "react";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import {
  usePlaybackPageOverlayPortal,
  usePlaybackPageScrollLock,
} from "src/components/PlaybackPageShell/PlaybackPageShell.context";
import portalStyles from "src/styles/modules/base-ui-portal.module.css";
import { definedProps } from "src/utils/definedProps";
import styles from "./AppDialog.module.css";

type AppDialogBackdropVariant = "default" | "modal" | "strong";

interface AppDialogProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  testId?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  panelClassName?: string;
  backdropVariant?: AppDialogBackdropVariant;
  escapeStackingContext?: boolean;
  aboveBottomDrawer?: boolean;
}

const popupClassByPlacement = ({
  aboveBottomDrawer,
  usesShellPortal,
  backdropVariant,
}: {
  aboveBottomDrawer: boolean;
  usesShellPortal: boolean;
  backdropVariant: AppDialogBackdropVariant;
}): string => {
  if (aboveBottomDrawer) {
    return styles.popupAboveDrawer;
  }

  if (usesShellPortal) {
    return backdropVariant === "default"
      ? styles.popupShell
      : styles.popupModalShell;
  }

  return backdropVariant === "default" ? styles.popup : styles.popupModal;
};

const backdropClassByVariant = (
  variant: AppDialogBackdropVariant,
  usesShellPortal: boolean,
): string => {
  if (usesShellPortal) {
    return variant === "strong"
      ? portalStyles.backdropshellstrong
      : variant === "modal"
        ? portalStyles.backdropshellmodal
        : portalStyles.backdropshell;
  }

  return variant === "strong"
    ? portalStyles.backdropStrong
    : variant === "modal"
      ? portalStyles.backdropModal
      : portalStyles.backdrop;
};

export const AppDialog = ({
  open,
  onClose,
  children,
  testId,
  ariaLabelledBy,
  ariaDescribedBy,
  panelClassName,
  backdropVariant = "default",
  escapeStackingContext = false,
  aboveBottomDrawer = false,
}: AppDialogProps) => {
  usePlaybackPageScrollLock(open);
  const overlayPortal = usePlaybackPageOverlayPortal();
  const usesShellPortal = overlayPortal !== null && !aboveBottomDrawer;
  const contentRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    contentRef.current?.focus();
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} modal="trap-focus">
      <Dialog.Portal
        {...definedProps({
          container: usesShellPortal ? (overlayPortal ?? undefined) : undefined,
        })}
      >
        <Dialog.Backdrop
          className={
            aboveBottomDrawer
              ? portalStyles.backdropAboveDrawer
              : backdropClassByVariant(backdropVariant, usesShellPortal)
          }
          {...definedProps({
            "data-testid": testId ? `${testId}-backdrop` : undefined,
          })}
        />
        <Dialog.Popup
          aria-modal={true}
          className={classNames(
            popupClassByPlacement({
              aboveBottomDrawer,
              usesShellPortal,
              backdropVariant,
            }),
            panelClassName,
          )}
          {...definedProps({
            "data-testid": testId,
            "aria-labelledby": ariaLabelledBy,
            "aria-describedby": ariaDescribedBy,
          })}
        >
          <div ref={contentRef} tabIndex={-1} className={styles.popupFocusRoot}>
            <OverlayStack
              escapeStackingContext={escapeStackingContext}
              className={styles.popupOverlayStack}
              popoverZIndex="var(--z-7-tooltip)"
            >
              {children}
            </OverlayStack>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
