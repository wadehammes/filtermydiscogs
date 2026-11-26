"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import type { DrawerFooterMoreMenuProps } from "src/components/DrawerFooterMoreMenu/DrawerFooterMoreMenu.interfaces";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { segmentedStyles } from "src/components/SegmentedControl/SegmentedControl.component";
import EllipsisHorizontalIcon from "src/styles/icons/ellipsis-horizontal-thin.svg";
import drawerFooterMenuStyles from "src/styles/modules/bottom-drawer-footer-menu.module.css";

export const DrawerFooterMoreMenu = ({
  children,
  className,
  disabled = false,
  footerInset,
  menuFooter,
  isOpen,
  onOpenChange,
  panelTestId,
  popupClassName,
  testId,
  triggerClassName,
  triggerIconClassName,
  triggerIcon = <EllipsisHorizontalIcon />,
  triggerLabel = "More",
}: DrawerFooterMoreMenuProps) => (
  <div
    className={classNames(drawerFooterMenuStyles.menuRoot, className)}
    data-testid={testId}
  >
    <Menu.Root open={isOpen} onOpenChange={onOpenChange} modal={false}>
      <Menu.Trigger
        disabled={disabled}
        render={(props) => (
          <IconButton
            {...props}
            ref={(node) => {
              if (typeof props.ref === "function") {
                props.ref(node);
              } else if (props.ref) {
                props.ref.current = node;
              }
            }}
            className={classNames(
              drawerFooterMenuStyles.menuTrigger,
              triggerClassName,
              {
                [segmentedStyles.active]: isOpen,
              },
            )}
            iconClassName={triggerIconClassName}
            label={triggerLabel}
            disabled={disabled}
          >
            {triggerIcon}
          </IconButton>
        )}
      />
      <InlinePopoverMenu.Panel
        align="end"
        side="top"
        popupClassName={classNames(
          drawerFooterMenuStyles.menuPopup,
          popupClassName,
        )}
        positionMethod="fixed"
        positionerClassName={drawerFooterMenuStyles.drawerFooterMenuPositioner}
        testId={panelTestId}
      >
        <InlinePopoverMenu.List>{children}</InlinePopoverMenu.List>
        {menuFooter ? (
          <InlinePopoverMenu.Footer>{menuFooter}</InlinePopoverMenu.Footer>
        ) : null}
        {footerInset ? (
          <InlinePopoverMenu.FooterInset
            className={drawerFooterMenuStyles.menuFooterInset}
          >
            {footerInset}
          </InlinePopoverMenu.FooterInset>
        ) : null}
      </InlinePopoverMenu.Panel>
    </Menu.Root>
  </div>
);
