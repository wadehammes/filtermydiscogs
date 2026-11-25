import classNames from "classnames";
import { type ButtonHTMLAttributes, type ReactNode, type Ref } from "react";
import {
  type IconButtonVariant,
  iconButtonClasses,
  iconButtonIconClasses,
  iconButtonLayoutClass,
} from "./iconButtonClasses";

export type { IconButtonVariant };

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
  variant?: IconButtonVariant;
  iconClassName?: string | undefined;
  label?: ReactNode;
  labelClassName?: string | undefined;
  addon?: ReactNode;
  addonClassName?: string | undefined;
  children?: ReactNode;
}

export const IconButton = ({
  ref,
  variant = "default",
  className,
  iconClassName,
  label,
  labelClassName,
  addon,
  addonClassName,
  children,
  type = "button",
  ...props
}: IconButtonProps) => {
  const isLabeled = label != null || addon != null;

  return (
    <button
      ref={ref}
      type={type}
      className={classNames(
        iconButtonClasses(variant),
        iconButtonLayoutClass(isLabeled),
        className,
      )}
      data-testid="fmdIconButton"
      {...props}
    >
      {children != null ? (
        <span className={iconButtonIconClasses(iconClassName)} aria-hidden>
          {children}
        </span>
      ) : null}
      {label != null ? <span className={labelClassName}>{label}</span> : null}
      {addon != null ? <span className={addonClassName}>{addon}</span> : null}
    </button>
  );
};

IconButton.displayName = "IconButton";