"use client";

import { Dialog } from "@base-ui/react/dialog";
import classNames from "classnames";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { useId } from "react";
import { AppDialog } from "src/components/AppDialog/AppDialog.component";
import { definedProps } from "src/utils/definedProps";
import styles from "./FormDialog.module.css";

type AppDialogProps = ComponentPropsWithoutRef<typeof AppDialog>;

export type FormDialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  headerAddon?: ReactNode;
  testId?: string;
  titleId?: string;
  descriptionId?: string;
  titleClassName?: string;
  panelClassName?: string;
  panelWidth?: "sm" | "md";
  backdropVariant?: AppDialogProps["backdropVariant"];
};

const FormDialogRoot = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  headerAddon,
  testId,
  titleId: titleIdProp,
  descriptionId: descriptionIdProp,
  titleClassName,
  panelClassName,
  panelWidth = "sm",
  backdropVariant,
}: FormDialogProps) => {
  const generatedTitleId = useId();
  const generatedDescriptionId = useId();
  const titleId = titleIdProp ?? generatedTitleId;
  const descriptionId = descriptionIdProp ?? generatedDescriptionId;

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      panelClassName={classNames(
        styles.panel,
        {
          [styles.panelMd]: panelWidth === "md",
        },
        panelClassName,
      )}
      {...definedProps({
        testId,
        backdropVariant,
        ariaLabelledBy: titleId,
        ariaDescribedBy: description ? descriptionId : undefined,
      })}
    >
      <div className={styles.content}>
        <header className={styles.header}>
          {headerAddon ? (
            <div className={styles.titleRow}>
              <Dialog.Title
                id={titleId}
                className={classNames(styles.title, titleClassName)}
              >
                {title}
              </Dialog.Title>
              {headerAddon}
            </div>
          ) : (
            <Dialog.Title
              id={titleId}
              className={classNames(styles.title, titleClassName)}
            >
              {title}
            </Dialog.Title>
          )}
          {description ? (
            <Dialog.Description
              id={descriptionId}
              className={styles.description}
            >
              {description}
            </Dialog.Description>
          ) : null}
        </header>
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </AppDialog>
  );
};

type FormDialogFieldProps = {
  label: ReactNode;
  htmlFor: string;
  children: ReactNode;
  className?: string;
};

const FormDialogField = ({
  label,
  htmlFor,
  children,
  className,
}: FormDialogFieldProps) => (
  <div className={classNames(styles.field, className)}>
    <label className={styles.label} htmlFor={htmlFor}>
      {label}
    </label>
    {children}
  </div>
);

type FormDialogCheckboxFieldProps = {
  label: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<"input">;

const FormDialogCheckboxField = ({
  label,
  className,
  ...inputProps
}: FormDialogCheckboxFieldProps) => (
  <label className={classNames(styles.checkboxLabel, className)}>
    <input type="checkbox" className={styles.checkbox} {...inputProps} />
    <span>{label}</span>
  </label>
);

export const FormDialog = Object.assign(FormDialogRoot, {
  Field: FormDialogField,
  CheckboxField: FormDialogCheckboxField,
});

export { styles as formDialogStyles };
