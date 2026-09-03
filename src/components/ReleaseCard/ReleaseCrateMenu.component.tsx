"use client";

import { Menu } from "@base-ui/react/menu";
import { useQueryClient } from "@tanstack/react-query";
import classNames from "classnames";
import type { MouseEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import { CreateCrateDialog } from "src/components/CreateCrateDialog/CreateCrateDialog.component";
import { useAuth } from "src/context/auth.context";
import { useCrateActions, useCrateState } from "src/context/crate.context";
import {
  prefetchReleaseCrateMembership,
  useReleaseCrateMembershipQuery,
} from "src/hooks/queries/useReleaseCrateMembershipQuery";
import { useFilterControlPositionerZIndex } from "src/hooks/useFilterControlPositionerZIndex.hook";
import { useScrollEdgeFade } from "src/hooks/useScrollEdgeFade.hook";
import type { CreateCrateFormValues } from "src/lib/validation/crate.schemas";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import menuStyles from "src/styles/modules/inline-popover-menu.module.css";
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
  const { positionerStyle, handleOpenChange: updatePositionerZIndex } =
    useFilterControlPositionerZIndex(triggerRef);
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
  const instanceId = String(release.instance_id);
  const { data: membership } = useReleaseCrateMembershipQuery({
    userId,
    instanceId,
    enabled: isOpen,
  });

  const memberCrateIds = useMemo(() => {
    const ids = new Set(membership?.crateIds ?? []);

    if (activeCrateInstanceIds.has(instanceId) && activeCrateId) {
      ids.add(activeCrateId);
    }

    return ids;
  }, [activeCrateId, activeCrateInstanceIds, instanceId, membership?.crateIds]);

  const inActiveCrate = activeCrateInstanceIds.has(instanceId);
  const activeCrate = useMemo(
    () => crates.find((crate) => crate.id === activeCrateId) ?? null,
    [activeCrateId, crates],
  );
  const otherCrates = useMemo(
    () => crates.filter((crate) => crate.id !== activeCrateId),
    [activeCrateId, crates],
  );
  const isInAllCrates = useMemo(
    () =>
      crates.length > 0 &&
      crates.every((crate) => memberCrateIds.has(crate.id)),
    [crates, memberCrateIds],
  );
  const showToggleAllAction = crates.length > 1;
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

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      updatePositionerZIndex(open);
    },
    [updatePositionerZIndex],
  );

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

  const renderCrateItem = (
    crate: (typeof crates)[number],
    { showCurrentLabel = false }: { showCurrentLabel?: boolean } = {},
  ) => {
    const isMember = memberCrateIds.has(crate.id);

    return (
      <Menu.CheckboxItem
        key={crate.id}
        checked={isMember}
        className={classNames(styles.crateMenuItem, {
          [styles.menuItemActive]: isMember,
        })}
        closeOnClick={false}
        label={crate.name}
        onCheckedChange={(checked) => {
          handleCheckedChange(crate.id, checked);
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <Menu.CheckboxItemIndicator className={styles.checkIndicator}>
          <CheckThinIcon className={styles.checkIcon} strokeWidth={1.75} />
        </Menu.CheckboxItemIndicator>
        <span className={styles.menuItemLabel} title={crate.name}>
          {crate.name}
        </span>
        {showCurrentLabel ? (
          <span className={styles.menuItemMeta}>Current</span>
        ) : null}
      </Menu.CheckboxItem>
    );
  };

  const triggerLabel = inActiveCrate ? "Manage crates" : "Add to crates";
  const triggerText = inActiveCrate ? "− Remove from Crate" : "+ Add to Crate";
  const useCustomTrigger = triggerVariant === "custom" || isVertical;
  const triggerClass = useCustomTrigger
    ? actionClass(inActiveCrate)
    : classNames(cardStyles.crateActionButton, {
        [cardStyles.crateActionButtonActive]: inActiveCrate,
      });
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
            {triggerStyle === "text" ? (
              triggerText
            ) : inActiveCrate ? (
              <MinusIcon className={stackStyles.actionIcon} aria-hidden />
            ) : (
              <PlusIcon className={stackStyles.actionIcon} aria-hidden />
            )}
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              align="end"
              className={menuStyles.positioner}
              side={isVertical ? "left" : "bottom"}
              sideOffset={8}
              style={positionerStyle}
            >
              <Menu.Popup
                className={styles.menuPopup}
                data-testid="fmdReleaseCrateMenu"
              >
                <p className={styles.menuHeading}>
                  {inActiveCrate ? "Manage crates" : "Add to crates"}
                </p>
                {activeCrate ? (
                  <div className={styles.menuSection}>
                    {renderCrateItem(activeCrate, { showCurrentLabel: true })}
                  </div>
                ) : null}
                {otherCrates.length > 0 ? (
                  <div
                    className={classNames(styles.crateListScrollWrap, {
                      [styles.crateListScrollFadeTop]: crateListScrollFade.top,
                      [styles.crateListScrollFadeBottom]:
                        crateListScrollFade.bottom,
                      [styles.crateListScrollWrapSeparated]:
                        activeCrate !== null,
                    })}
                  >
                    <div
                      ref={crateListScrollRef}
                      className={styles.crateListScroll}
                      onScroll={updateCrateListScrollFade}
                    >
                      <div className={styles.menuSection}>
                        {otherCrates.map((crate) => renderCrateItem(crate))}
                      </div>
                    </div>
                  </div>
                ) : crates.length === 0 ? (
                  <p className={classNames(menuStyles.empty, styles.menuEmpty)}>
                    No crates yet
                  </p>
                ) : null}
                {showToggleAllAction ? (
                  <div className={styles.menuFooter}>
                    <Menu.Item
                      className={styles.crateMenuItem}
                      closeOnClick={false}
                      data-testid="fmdReleaseCrateMenuToggleAll"
                      disabled={isCrateActionPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleAllCrates();
                      }}
                    >
                      {isInAllCrates ? "Remove from all" : "Add to all"}
                    </Menu.Item>
                  </div>
                ) : null}
                <div className={styles.menuFooter}>
                  <Menu.Item
                    className={styles.crateMenuItem}
                    disabled={isCrateActionPending}
                    onClick={handleOpenCreateDialog}
                  >
                    <span className={styles.menuItemIcon} aria-hidden="true">
                      <PlusIcon />
                    </span>
                    Add to new crate
                  </Menu.Item>
                </div>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
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
