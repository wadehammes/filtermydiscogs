"use client";

import { Menu } from "@base-ui/react/menu";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import type { MouseEvent } from "react";
import { useCallback, useRef, useState } from "react";
import { CreateCrateDialog } from "src/components/CreateCrateDialog/CreateCrateDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { ReleaseCrateMenuPanelContent } from "src/components/ReleaseCard/ReleaseCrateMenuPanelContent.component";
import { useReleaseCrateMenuDerivedState } from "src/components/ReleaseCard/useReleaseCrateMenuDerivedState.hook";
import { useAuth } from "src/context/auth.context";
import { useCrateActions, useCrateState } from "src/context/crate.context";
import { prefetchReleaseCrateMembership } from "src/hooks/queries/useReleaseCrateMembershipQuery";
import { useScrollEdgeFade } from "src/hooks/useScrollEdgeFade.hook";
import type { CreateCrateFormValues } from "src/lib/validation/crate.schemas";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import cardStyles from "./ReleaseCard.module.css";
import styles from "./ReleaseCrateMenu.module.css";

interface ReleaseCrateMenuProps {
  release: DiscogsRelease;
  layout?: "horizontal" | "vertical";
  triggerVariant?: "card" | "custom";
  triggerStyle?: "icon" | "text";
  actionClass: (active?: boolean) => string;
  slotClass?: string;
}

export const ReleaseCrateMenu = ({
  release,
  layout = "horizontal",
  triggerVariant = "card",
  triggerStyle = "icon",
  actionClass,
  slotClass = "",
}: ReleaseCrateMenuProps) => {
  const isVertical = layout === "vertical";
  const queryClient = useQueryClient();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const {
    state: { userId },
  } = useAuth();
  const {
    crates,
    activeCrateId,
    activeCrateInstanceIds,
    isLoading,
    isUpdatingCrate,
    isCreatingCrate,
  } = useCrateState();
  const {
    addReleaseToCrate,
    removeReleaseFromCrate,
    setReleaseCrateMembership,
    createCrate,
  } = useCrateActions();
  const isCrateActionPending = isCreatingCrate || isUpdatingCrate;

  const {
    instanceId,
    memberCrateIds,
    inActiveCrate,
    activeCrate,
    otherCrates,
    isInAllCrates,
    showToggleAllAction,
  } = useReleaseCrateMenuDerivedState({
    release,
    userId,
    isOpen,
    crates,
    activeCrateId,
    activeCrateInstanceIds,
  });

  const {
    scrollRef: crateListScrollRef,
    fade: crateListScrollFade,
    onScroll: updateCrateListScrollFade,
  } = useScrollEdgeFade<HTMLDivElement>({
    enabled: isOpen && otherCrates.length > 0,
  });

  const handleTriggerClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const prefetchMembership = useCallback(() => {
    void prefetchReleaseCrateMembership(queryClient, { userId, instanceId });
  }, [instanceId, queryClient, userId]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const handleCheckedChange = useCallback(
    (crateId: string, checked: boolean) => {
      if (checked) {
        addReleaseToCrate(crateId, release, {
          openDrawer: crateId === activeCrateId,
        });
        return;
      }

      removeReleaseFromCrate(crateId, instanceId);
    },
    [
      activeCrateId,
      addReleaseToCrate,
      instanceId,
      release,
      removeReleaseFromCrate,
    ],
  );

  const handleToggleAllCrates = useCallback(() => {
    const targetCrateIds = isInAllCrates ? [] : crates.map((crate) => crate.id);

    setReleaseCrateMembership(targetCrateIds, release, {
      openDrawer:
        !isInAllCrates &&
        activeCrateId !== null &&
        targetCrateIds.includes(activeCrateId),
    });
  }, [
    activeCrateId,
    crates,
    isInAllCrates,
    release,
    setReleaseCrateMembership,
  ]);

  const handleOpenCreateDialog = useCallback(() => {
    setIsOpen(false);
    setShowCreateDialog(true);
  }, []);

  const handleCreateCrate = useCallback(
    async ({ name, setAsDefault }: CreateCrateFormValues) => {
      const crateId = await createCrate(name, { setAsDefault });

      if (!crateId) {
        return;
      }

      addReleaseToCrate(crateId, release, { openDrawer: true });
      setShowCreateDialog(false);
    },
    [addReleaseToCrate, createCrate, release],
  );

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
      <div className={wrapperClass}>
        <Menu.Root open={isOpen} onOpenChange={handleOpenChange} modal={false}>
          <Menu.Trigger
            ref={triggerRef}
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
                  onPointerEnter={prefetchMembership}
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
                  onPointerEnter={prefetchMembership}
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
            side={isVertical ? "left" : "bottom"}
            testId="fmdReleaseCrateMenu"
          >
            <ReleaseCrateMenuPanelContent
              inActiveCrate={inActiveCrate}
              activeCrate={activeCrate}
              otherCrates={otherCrates}
              cratesCount={crates.length}
              memberCrateIds={memberCrateIds}
              showToggleAllAction={showToggleAllAction}
              isInAllCrates={isInAllCrates}
              isCrateActionPending={isCrateActionPending}
              crateListScrollRef={crateListScrollRef}
              crateListScrollFade={crateListScrollFade}
              updateCrateListScrollFade={updateCrateListScrollFade}
              onCheckedChange={handleCheckedChange}
              onToggleAllCrates={handleToggleAllCrates}
              onOpenCreateDialog={handleOpenCreateDialog}
            />
          </InlinePopoverMenu.Panel>
        </Menu.Root>
        {showTooltip ? (
          <span className={cardStyles.tooltip}>{triggerLabel}</span>
        ) : null}
      </div>
      <CreateCrateDialog
        isOpen={showCreateDialog}
        isSubmitting={isCrateActionPending}
        onClose={() => {
          setShowCreateDialog(false);
        }}
        onCreate={handleCreateCrate}
      />
    </>
  );
};
