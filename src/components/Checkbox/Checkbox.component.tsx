"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import classNames from "classnames";
import type { ChangeEvent, ComponentPropsWithoutRef, Ref } from "react";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import styles from "./Checkbox.module.css";

type BaseRootProps = ComponentPropsWithoutRef<typeof BaseCheckbox.Root>;

export type CheckboxProps = Omit<
  BaseRootProps,
  "onCheckedChange" | "className"
> & {
  className?: string;
  inputRef?: Ref<HTMLInputElement>;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const Checkbox = ({
  className,
  inputRef,
  onChange,
  onCheckedChange,
  ...rootProps
}: CheckboxProps) => {
  const handleCheckedChange = (checked: boolean) => {
    onCheckedChange?.(checked);
    if (onChange) {
      onChange({
        target: { checked, type: "checkbox" },
        currentTarget: { checked, type: "checkbox" },
      } as ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <BaseCheckbox.Root
      {...rootProps}
      className={classNames(styles.root, className)}
      inputRef={inputRef}
      onCheckedChange={handleCheckedChange}
    >
      <BaseCheckbox.Indicator className={styles.indicator}>
        <CheckThinIcon className={styles.checkIcon} strokeWidth={2.5} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
};
