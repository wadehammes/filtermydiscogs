"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import type { MouseEvent } from "react";
import { useCallback, useState } from "react";
import { CreateCrateDialog } from "src/components/CreateCrateDialog/CreateCrateDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { ReleaseCrateMenuPanelContent } from "src/components/ReleaseCard/ReleaseCrateMenuPanelContent.component";
import { useReleaseCrateMenuController } from "src/hooks/useReleaseCrateMenuController.hook";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import { shouldRunReleaseCrateMembershipHoverPrefetch } from "src/utils/releaseCrateMembershipHoverPrefetch";
import cardStyles from "./ReleaseCard.module.css";
import styles from "./ReleaseCrateMenu.module.css";

interface ReleaseCrateMenuProps {
  release: DiscogsRelease;
  layout?: "horizontal" | "vertical";
  triggerVariant?: "card" | "custom";
  triggerStyle?: "icon" | "text";
  actionClass: (active?: boolean) => string;
  slotClass?: string;
  portaled?: boolean;
}

export const ReleaseCrateMenu = ({
  release,
  layout = "horizontal",
  triggerVariant = "card",
  triggerStyle = "icon",
  actionClass,
  slotClass = "",
  portaled: portaledProp,
}: ReleaseCrateMenuProps) => {
  const isVertical = layout === "vertical";
  const portaled = portaledProp ?? isVertical;
  const [menuHostElement, setMenuHostElement] = useState<HTMLElement | null>(
    null,
  );
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);
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

  const prefetchMembershipOnHover = useCallback(() => {
    if (!shouldRunReleaseCrateMembershipHoverPrefetch()) {
      return;
    }

    prefetchMembership();
  }, [prefetchMembership]);

  const triggerLabel = inActiveCrate ? "Manage crates" : "Add to crates";
  const triggerText = inActiveCrate ? "− Remove from Crate" : "+ Add to Crate";
  const useCustomTrigger = triggerVariant === "custom" || isVertical;
  const triggerClass = useCustomTrigger
    ? actionClass(inActiveCrate)
    : cardStyles.crateActionButton;
  const wrapperClass =
    triggerVariant === "custom" || isVertical
      ? slotClass
      : classNames(cardStyles.segmentSlot, cardStyles.crateActionSlot);
  const showTooltip =
    triggerVariant === "card" && !isVertical && triggerStyle === "icon";

  return (
    <>
      <div
        ref={setMenuHostElement}
        className={classNames(wrapperClass, styles.menuHost)}
        data-release-crate-menu-host
        data-testid="fmdReleaseCrateMenuHost"
      >
        <Menu.Root open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <Menu.Trigger
            render={(props) =>
              triggerStyle === "text" ? (
                <button
                  {...props}
                  type="button"
                  className={classNames(styles.menuRoot, triggerClass)}
                  aria-haspopup="menu"
                  aria-label={triggerLabel}
                  aria-pressed={inActiveCrate}
                  disabled={isLoading || isCrateActionPending}
                  onClick={handleTriggerClick}
                  onFocus={prefetchMembership}
                  onPointerDown={prefetchMembership}
                  onPointerEnter={prefetchMembershipOnHover}
                  data-testid="fmdReleaseCrateMenuTrigger"
                >
                  {triggerText}
                </button>
              ) : (
                <IconButton
                  {...props}
                  variant={inActiveCrate ? "minus" : "plus"}
                  type="button"
                  className={classNames(styles.menuRoot, triggerClass)}
                  iconClassName={stackStyles.actionIcon}
                  aria-haspopup="menu"
                  aria-label={triggerLabel}
                  aria-pressed={inActiveCrate}
                  disabled={isLoading || isCrateActionPending}
                  onClick={handleTriggerClick}
                  onFocus={prefetchMembership}
                  onPointerDown={prefetchMembership}
                  onPointerEnter={prefetchMembershipOnHover}
                  data-testid="fmdReleaseCrateMenuTrigger"
                >
                  {inActiveCrate ? <MinusIcon /> : <PlusIcon />}
                </IconButton>
              )
            }
          />
          <InlinePopoverMenu.Panel
            align="end"
            popupClassName={styles.menuPopup}
            portaled={portaled}
            portalContainer={portaled ? null : menuHostElement}
            positionerClassName={styles.menuPositioner}
            side={isVertical ? "left" : "bottom"}
            testId="fmdReleaseCrateMenu"
            useOverlayStack={portaled}
          >
            <ReleaseCrateMenuPanelContent {...panelContentProps} />
          </InlinePopoverMenu.Panel>
        </Menu.Root>
        {showTooltip ? (
          <span className={cardStyles.tooltip}>{triggerLabel}</span>
        ) : null}
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
