import type { ReactNode } from "react";
import itemIconStyles from "src/styles/modules/inline-popover-menu-item-icon.module.css";

export const InlinePopoverMenuItemIcon = ({
  children,
}: {
  children: ReactNode;
}) => (
  <span className={itemIconStyles.itemIcon} aria-hidden>
    {children}
  </span>
);
