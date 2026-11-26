"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { DrawerFooterMoreMenu } from "src/components/DrawerFooterMoreMenu/DrawerFooterMoreMenu.component";
import { inlinePopoverMenuStyles } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { InlinePopoverMenuItemIcon } from "src/components/InlinePopoverMenu/InlinePopoverMenuItemIcon.component";
import { SupportProjectNavLink } from "src/components/SupportProjectNavLink/SupportProjectNavLink.component";
import { SUPPORT_PROJECT_NAV_LABEL } from "src/constants/supportProjectToast.constants";
import { useInlinePopoverMenuClose } from "src/hooks/useInlinePopoverMenuClose.hook";
import HeartIcon from "src/styles/icons/heart-thin.svg";
import InfoCircleIcon from "src/styles/icons/info-circle-thin.svg";
import { definedProps } from "src/utils/definedProps";

type MobileMenuFooterMoreMenuProps = {
  onNavigate: () => void;
  triggerClassName?: string;
  triggerIconClassName?: string;
};

export const MobileMenuFooterMoreMenu = ({
  onNavigate,
  triggerClassName,
  triggerIconClassName,
}: MobileMenuFooterMoreMenuProps) => {
  const { isOpen, runAction, setIsOpen } = useInlinePopoverMenuClose();

  return (
    <DrawerFooterMoreMenu
      {...definedProps({
        triggerClassName,
        triggerIconClassName,
      })}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      panelTestId="fmdMobileMenuFooterMorePopup"
      testId="fmdMobileMenuFooterMoreMenu"
    >
      <Menu.LinkItem
        closeOnClick
        render={
          <Link href="/about" className={inlinePopoverMenuStyles.linkRow} />
        }
        className={inlinePopoverMenuStyles.item}
        onClick={() => {
          runAction(onNavigate);
        }}
      >
        <InlinePopoverMenuItemIcon>
          <InfoCircleIcon />
        </InlinePopoverMenuItemIcon>
        About
      </Menu.LinkItem>
      <Menu.LinkItem
        closeOnClick
        render={
          <SupportProjectNavLink
            className={inlinePopoverMenuStyles.linkRow}
            onClick={() => {
              runAction(onNavigate);
            }}
          />
        }
        className={inlinePopoverMenuStyles.item}
      >
        <InlinePopoverMenuItemIcon>
          <HeartIcon />
        </InlinePopoverMenuItemIcon>
        {SUPPORT_PROJECT_NAV_LABEL}
      </Menu.LinkItem>
    </DrawerFooterMoreMenu>
  );
};
