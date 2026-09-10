import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";
import {
  type IconButtonVariant,
  iconButtonClasses,
  iconButtonIconClasses,
} from "./iconButtonClasses";

export type { IconButtonVariant };

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  iconClassName?: string | undefined;
  label?: ReactNode;
  labelClassName?: string | undefined;
  addon?: ReactNode;
  addonClassName?: string | undefined;
  children?: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
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
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={iconButtonClasses(variant, className)}
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
  },
);
