import classNames from "classnames";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import type { IconButtonVariant } from "src/components/IconButton/IconButton.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { IconButtonLink } from "src/components/IconButton/IconButtonLink.component";
import XIcon from "src/styles/icons/x-thin.svg";
import { definedProps } from "src/utils/definedProps";
import styles from "./ModalToolbar.module.css";

interface ModalToolbarProps {
  onClose?: () => void;
  title?: string;
  titleId?: string;
  children?: ReactNode;
}

export function ModalToolbar({
  onClose,
  title,
  titleId,
  children,
}: ModalToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLead}>
        {children}
        {title ? (
          <h2 className={styles.title} {...definedProps({ id: titleId })}>
            {title}
          </h2>
        ) : null}
      </div>
      {onClose ? (
        <IconButton
          variant="close"
          className={classNames(styles.actionButton, styles.closeButton)}
          onClick={onClose}
          aria-label="Close modal"
          iconClassName={styles.actionIcon}
        >
          <XIcon />
        </IconButton>
      ) : null}
    </div>
  );
}

export function ModalToolbarLink({
  className,
  variant = "default",
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: IconButtonVariant;
}) {
  return (
    <IconButtonLink
      variant={variant}
      className={classNames(styles.actionButton, className)}
      iconClassName={styles.actionIcon}
      {...props}
    >
      {children}
    </IconButtonLink>
  );
}
