import classNames from "classnames";
import type { ReactNode } from "react";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import segmentedStyles from "src/styles/modules/segmented-control.module.css";

export interface SegmentedControlProps {
  legend: string;
  children: ReactNode;
  className?: string | undefined;
  vertical?: boolean;
  allowOverflow?: boolean;
}

export const SegmentedControl = ({
  legend,
  children,
  className,
  vertical = false,
  allowOverflow = false,
}: SegmentedControlProps) => (
  <fieldset
    className={classNames(
      segmentedStyles.container,
      {
        [segmentedStyles.containerVertical]: vertical,
        [segmentedStyles.containerAllowOverflow]: allowOverflow,
      },
      className,
    )}
  >
    <legend
      className={classNames(
        segmentedStyles.legend,
        accessibilityStyles.visuallyHidden,
      )}
    >
      {legend}
    </legend>
    {children}
  </fieldset>
);

export { segmentedStyles };
