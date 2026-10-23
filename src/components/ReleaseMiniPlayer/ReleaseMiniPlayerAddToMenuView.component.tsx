"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import type { MouseEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { CreateCrateDialog } from "src/components/CreateCrateDialog/CreateCrateDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import {
  ReleaseCrateMenuSubmenuPanel,
  ReleaseCrateMenuSubmenuTrigger,
} from "src/components/ReleaseCard/ReleaseCrateMenuSubmenu.component";
import { useReleaseCrateMenuController } from "src/hooks/useReleaseCrateMenuController.hook";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseMiniPlayerAddToMenu.module.css";

const ADD_TO_MENU_LABEL = "Add to";

export interface ReleaseMiniPlayerAddToMenuViewProps {
  release: DiscogsRelease;
  actionClass: (active?: boolean) => string;
  slotClass?: string;
  playlistSubmenu?: ReactNode;
  registerCloseMenu?: (closeMenu: () => void) => void;
  submenuOpenOnHover?: boolean;
}

export const ReleaseMiniPlayerAddToMenuView = ({
  release,
  actionClass,
  slotClass = "",
  playlistSubmenu = null,
  registerCloseMenu,
  submenuOpenOnHover,
}: ReleaseMiniPlayerAddToMenuViewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    registerCloseMenu?.(closeMenu);
  }, [closeMenu, registerCloseMenu]);

  const {
    isLoading,
    isCrateActionPending,
    showCreateDialog,
    closeCreateDialog,
    prefetchMembership,
    handleCreateCrate,
    panelContentProps,
  } = useReleaseCrateMenuController(release, isOpen, closeMenu);
  const { inActiveCrate } = panelContentProps;

  const handleTriggerClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <div
        className={classNames(slotClass, styles.menuHost)}
        data-testid="fmdReleaseAddToMenuHost"
      >
        <Menu.Root open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <Menu.Trigger
            render={(props) => (
              <IconButton
                {...props}
                variant={inActiveCrate ? "minus" : "plus"}
                type="button"
                className={classNames(
                  styles.menuRoot,
                  actionClass(inActiveCrate),
                )}
                iconClassName={stackStyles.actionIcon}
                aria-haspopup="menu"
                aria-label={ADD_TO_MENU_LABEL}
                aria-pressed={inActiveCrate}
                disabled={isLoading || isCrateActionPending}
                onClick={handleTriggerClick}
                onFocus={prefetchMembership}
                onPointerDown={prefetchMembership}
                onPointerEnter={prefetchMembership}
                data-testid="fmdReleaseAddToMenuTrigger"
              >
                {inActiveCrate ? <MinusIcon /> : <PlusIcon />}
              </IconButton>
            )}
          />
          <InlinePopoverMenu.Panel
            align="end"
            popupClassName={styles.menuPopup}
            portaled
            side="top"
            testId="fmdReleaseAddToMenu"
            useOverlayStack
          >
            <InlinePopoverMenu.Heading className={styles.menuHeading}>
              {ADD_TO_MENU_LABEL}
            </InlinePopoverMenu.Heading>
            <InlinePopoverMenu.List>
              <Menu.SubmenuRoot>
                <ReleaseCrateMenuSubmenuTrigger
                  inActiveCrate={inActiveCrate}
                  {...definedProps({ openOnHover: submenuOpenOnHover })}
                />
                <ReleaseCrateMenuSubmenuPanel
                  panelContentProps={panelContentProps}
                />
              </Menu.SubmenuRoot>
              {playlistSubmenu}
            </InlinePopoverMenu.List>
          </InlinePopoverMenu.Panel>
        </Menu.Root>
      </div>
      <CreateCrateDialog
        isOpen={showCreateDialog}
        isSubmitting={isCrateActionPending}
        onClose={closeCreateDialog}
        onCreate={handleCreateCrate}
      />
    </>
  );
};
