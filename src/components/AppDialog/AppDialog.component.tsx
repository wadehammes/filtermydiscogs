"use client";

import { Dialog } from "@base-ui/react/dialog";
import classNames from "classnames";
import type { ReactNode } from "react";
import { useCallback } from "react";
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
}

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
}: AppDialogProps) => {
  usePlaybackPageScrollLock(open);
  const overlayPortal = usePlaybackPageOverlayPortal();
  const usesShellPortal = overlayPortal !== null;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} modal="trap-focus">
      <Dialog.Portal
        {...definedProps({
          container: overlayPortal ?? undefined,
        })}
      >
        <Dialog.Backdrop
          className={backdropClassByVariant(backdropVariant, usesShellPortal)}
          {...definedProps({
            "data-testid": testId ? `${testId}-backdrop` : undefined,
          })}
        />
        <Dialog.Popup
          aria-modal={true}
          className={classNames(
            usesShellPortal
              ? backdropVariant === "default"
                ? styles.popupShell
                : styles.popupModalShell
              : backdropVariant === "default"
                ? styles.popup
                : styles.popupModal,
            panelClassName,
          )}
          {...definedProps({
            "data-testid": testId,
            "aria-labelledby": ariaLabelledBy,
            "aria-describedby": ariaDescribedBy,
          })}
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
