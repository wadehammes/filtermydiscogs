import classNames from "classnames";

export const validatedFieldClass = (
  ...classes: Array<string | undefined | false | null>
): string => classNames("validated-field", ...classes);
