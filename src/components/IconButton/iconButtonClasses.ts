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
  default: undefined,
  plus: iconButtonStyles.variantplus,
  minus: iconButtonStyles.variantminus,
  close: iconButtonStyles.variantclose,
  external: iconButtonStyles.variantexternal,
  queue: iconButtonStyles.variantqueue,
  skip: iconButtonStyles.variantskip,
};

export const iconButtonClasses = (
  variant: IconButtonVariant = "default",
  ...className: Array<string | undefined | false | null>
) => classNames(iconButtonStyles.button, VARIANT_CLASS[variant], ...className);

export const iconButtonIconClasses = (
  ...className: Array<string | undefined | false | null>
) => classNames(iconButtonStyles.icon, ...className);
