import classNames from "classnames";
import type { AnchorHTMLAttributes, ReactNode } from "react";
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
        <button
          type="button"
          className={classNames(styles.actionButton, styles.closeButton)}
          onClick={onClose}
          aria-label="Close modal"
        >
          <XIcon className={styles.actionIcon} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

export function ModalToolbarLink({
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={classNames(styles.actionButton, className)} {...props} />
  );
}
