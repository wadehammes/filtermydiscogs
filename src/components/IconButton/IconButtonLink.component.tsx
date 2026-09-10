import classNames from "classnames";
import Link, { type LinkProps } from "next/link";
import { type AnchorHTMLAttributes, forwardRef, type ReactNode } from "react";
import { definedProps } from "src/utils/definedProps";
import {
  type IconButtonVariant,
  iconButtonClasses,
  iconButtonIconClasses,
  iconButtonLayoutClass,
} from "./iconButtonClasses";

export interface IconButtonLinkProps
  extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: IconButtonVariant;
  iconClassName?: string | undefined;
  label?: ReactNode;
  labelClassName?: string | undefined;
  addon?: ReactNode;
  addonClassName?: string | undefined;
  children?: ReactNode;
  internal?: boolean;
}

export const IconButtonLink = forwardRef<
  HTMLAnchorElement,
  IconButtonLinkProps
>(function IconButtonLink(
  {
    variant = "default",
    className,
    iconClassName,
    label,
    labelClassName,
    addon,
    addonClassName,
    children,
    internal = false,
    href,
    ...props
  },
  ref,
) {
  const isLabeled = label != null || addon != null;
  const classes = classNames(
    iconButtonClasses(variant),
    iconButtonLayoutClass(isLabeled),
    className,
  );
  const content = (
    <>
      {children != null ? (
        <span className={iconButtonIconClasses(iconClassName)} aria-hidden>
          {children}
        </span>
      ) : null}
      {label != null ? <span className={labelClassName}>{label}</span> : null}
      {addon != null ? <span className={addonClassName}>{addon}</span> : null}
    </>
  );

  if (internal && href) {
    const linkProps = definedProps(props) as Omit<
      LinkProps,
      "href" | "className" | "children"
    >;

    return (
      <Link href={href} className={classes} ref={ref} {...linkProps}>
        {content}
      </Link>
    );
  }

  return (
    <a href={href} className={classes} ref={ref} {...definedProps(props)}>
      {content}
    </a>
  );
});
