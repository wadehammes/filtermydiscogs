"use client";

import classNames from "classnames";
import { IconButton } from "src/components/IconButton/IconButton.component";
import XIcon from "src/styles/icons/x-thin.svg";
import tableRowActionStyles from "src/styles/modules/table-row-actions.module.css";
import styles from "./BottomDrawer.module.css";

interface BottomDrawerCloseButtonProps {
  placement: "floating" | "header";
  ariaLabel: string;
  onClose: () => void;
}

export const BottomDrawerCloseButton = ({
  placement,
  ariaLabel,
  onClose,
}: BottomDrawerCloseButtonProps) => (
  <IconButton
    variant="close"
    className={classNames(
      placement === "header"
        ? tableRowActionStyles.actionButton
        : tableRowActionStyles.actionbuttontoggle,
      placement === "header"
        ? styles.headerCloseButton
        : styles.floatingShellClose,
    )}
    onClick={onClose}
    aria-label={ariaLabel}
    data-testid="fmdBottomDrawerCloseButton"
  >
    <XIcon />
  </IconButton>
);
