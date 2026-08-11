"use client";

import { Dialog } from "@base-ui/react/dialog";
import classNames from "classnames";
import type { ReactNode } from "react";
import { useCallback } from "react";
import portalStyles from "src/styles/base-ui-portal.module.css";
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

const backdropClassByVariant: Record<AppDialogBackdropVariant, string> = {
  default: portalStyles.backdrop,
  modal: portalStyles.backdropModal,
  strong: portalStyles.backdropStrong,
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
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={backdropClassByVariant[backdropVariant]}
          {...definedProps({
            "data-testid": testId ? `${testId}-backdrop` : undefined,
          })}
        />
        <Dialog.Popup
          aria-modal={true}
          className={classNames(
            backdropVariant === "modal" ? styles.popupModal : styles.popup,
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
