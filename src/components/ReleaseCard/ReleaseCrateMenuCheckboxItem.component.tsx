"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { inlinePopoverMenuStyles } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import styles from "./ReleaseCrateMenu.module.css";

interface ReleaseCrateMenuCheckboxItemProps {
  crateId: string;
  crateName: string;
  isMember: boolean;
  showCurrentLabel?: boolean;
  onCheckedChange: (crateId: string, checked: boolean) => void;
}

export const ReleaseCrateMenuCheckboxItem = ({
  crateId,
  crateName,
  isMember,
  showCurrentLabel = false,
  onCheckedChange,
}: ReleaseCrateMenuCheckboxItemProps) => (
  <Menu.CheckboxItem
    key={crateId}
    checked={isMember}
    className={classNames(inlinePopoverMenuStyles.item, styles.crateMenuItem, {
      [styles.menuItemActive]: isMember,
    })}
    closeOnClick={false}
    label={crateName}
    onCheckedChange={(checked) => {
      onCheckedChange(crateId, checked);
    }}
    onClick={(event) => {
      event.stopPropagation();
    }}
  >
    <Menu.CheckboxItemIndicator className={styles.checkIndicator}>
      <CheckThinIcon className={styles.checkIcon} strokeWidth={1.75} />
    </Menu.CheckboxItemIndicator>
    <span className={styles.menuItemLabel} title={crateName}>
      {crateName}
    </span>
    {showCurrentLabel ? (
      <span className={styles.menuItemMeta}>Current</span>
    ) : null}
  </Menu.CheckboxItem>
);
