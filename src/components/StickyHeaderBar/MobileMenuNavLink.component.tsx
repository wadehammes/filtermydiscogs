import classNames from "classnames";
import Link from "next/link";
import type {
  ComponentPropsWithoutRef,
  ComponentType,
  ReactNode,
  SVGProps,
} from "react";
import styles from "./MobileMenu.module.css";

type MobileMenuNavLinkProps = {
  active?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
} & ComponentPropsWithoutRef<typeof Link>;

export const MobileMenuNavLink = ({
  active = false,
  children,
  className,
  disabled = false,
  icon: Icon,
  ...linkProps
}: MobileMenuNavLinkProps) => {
  const itemClassName = classNames(styles.menuItem, className, {
    [styles.active]: active,
    [styles.disabled]: disabled,
  });

  return (
    <Link
      {...linkProps}
      className={itemClassName}
      aria-current={active ? "page" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : linkProps.tabIndex}
    >
      {Icon ? (
        <span className={styles.menuItemIcon} aria-hidden>
          <Icon />
        </span>
      ) : null}
      <span className={styles.menuItemLabel}>{children}</span>
    </Link>
  );
};
