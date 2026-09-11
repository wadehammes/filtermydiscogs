import classNames from "classnames";
import iconButtonStyles from "src/styles/modules/icon-button.module.css";

export type IconButtonVariant =
  | "default"
  | "plus"
  | "minus"
  | "close"
  | "external"
  | "queue"
  | "skip";

const VARIANT_CLASS: Record<IconButtonVariant, string | undefined> = {
  default: iconButtonStyles.variantdefault,
  plus: iconButtonStyles.variantplus,
  minus: iconButtonStyles.variantminus,
  close: iconButtonStyles.variantclose,
  external: iconButtonStyles.variantexternal,
  queue: iconButtonStyles.variantqueue,
  skip: undefined,
};

export const iconButtonClasses = (
  variant: IconButtonVariant = "default",
  ...className: Array<string | undefined | false | null>
) => classNames(VARIANT_CLASS[variant], ...className);

export const iconButtonIconClasses = (
  ...className: Array<string | undefined | false | null>
) => classNames(iconButtonStyles.icon, ...className);

export const iconButtonLayoutClass = (isLabeled: boolean) =>
  isLabeled ? iconButtonStyles.labeled : iconButtonStyles.iconOnly;
