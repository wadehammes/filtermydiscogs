"use client";

import { Menu } from "@base-ui/react/menu";
import Link from "next/link";
import { DrawerFooterMoreMenu } from "src/components/DrawerFooterMoreMenu/DrawerFooterMoreMenu.component";
import { inlinePopoverMenuStyles } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { SupportProjectNavLink } from "src/components/SupportProjectNavLink/SupportProjectNavLink.component";
import { SUPPORT_PROJECT_NAV_LABEL } from "src/constants/supportProjectToast.constants";
import { WHATS_NEW_NAV_LABEL } from "src/constants/whatsNew.constants";
import { useInlinePopoverMenuClose } from "src/hooks/useInlinePopoverMenuClose.hook";
import { definedProps } from "src/utils/definedProps";
import { openWhatsNewDialog } from "src/utils/whatsNewDialogBridge";

type MobileMenuFooterMoreMenuProps = {
  onLogout: () => void;
  onNavigate: () => void;
  triggerClassName?: string;
  triggerIconClassName?: string;
};

export const MobileMenuFooterMoreMenu = ({
  onLogout,
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
        About
      </Menu.LinkItem>
      <Menu.Item
        className={inlinePopoverMenuStyles.item}
        onClick={() => {
          runAction(() => {
            openWhatsNewDialog();
          });
        }}
      >
        {WHATS_NEW_NAV_LABEL}
      </Menu.Item>
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
        {SUPPORT_PROJECT_NAV_LABEL}
      </Menu.LinkItem>
      <Menu.Item
        className={inlinePopoverMenuStyles.itemDanger}
        onClick={() => {
          runAction(onLogout);
        }}
      >
        Logout
      </Menu.Item>
    </DrawerFooterMoreMenu>
  );
};
