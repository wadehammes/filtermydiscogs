"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useCloseMenuWhenFiltersBarHidden } from "src/components/FilterViewsMenu/useCloseMenuWhenFiltersBarHidden.hook";
import { SaveFilterViewDialog } from "src/components/SaveFilterViewDialog/SaveFilterViewDialog.component";
import { useFilterControlPositionerZIndex } from "src/hooks/useFilterControlPositionerZIndex.hook";
import { useFilterViews } from "src/hooks/useFilterViews.hook";
import BookmarkIcon from "src/styles/icons/bookmark-solid.svg";
import BookmarkOutlineIcon from "src/styles/icons/bookmark-thin.svg";
import { CheckThinIcon } from "src/styles/icons/CheckThinIcon.component";
import Chevron from "src/styles/icons/chevron-right-thin.svg";
import styles from "./FilterViewsMenu.module.css";

export interface FilterViewsMenuProps {
  disabled?: boolean;
  className?: string;
  variant?: "bar" | "drawer";
}

export const FilterViewsMenu = ({
  disabled = false,
  className,
  variant = "bar",
}: FilterViewsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { positionerStyle, handleOpenChange: updatePositionerZIndex } =
    useFilterControlPositionerZIndex(triggerRef);
  const {
    filterViews,
    matchingView,
    canSaveCurrentView,
    canAddView,
    hasActiveFilters,
    isSavingPreferences,
    applyView,
    resetFilters,
    saveCurrentView,
  } = useFilterViews();

  const triggerLabel = matchingView?.name ?? "Views";

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useCloseMenuWhenFiltersBarHidden({
    variant,
    isOpen,
    onClose: closeMenu,
  });

  const handleMenuOpenChange = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      updatePositionerZIndex(open);
    },
    [updatePositionerZIndex],
  );

  const runAction = useCallback(
    (action: () => void) => {
      closeMenu();
      action();
    },
    [closeMenu],
  );

  const emptyStateLabel =
    filterViews.length === 0 ? "No saved views yet" : null;

  return (
    <>
      <div
        className={classNames(styles.menuRoot, className, {
          [styles.drawerVariant]: variant === "drawer",
        })}
        data-testid="fmdFilterViewsMenu"
      >
        <Menu.Root
          open={isOpen}
          onOpenChange={handleMenuOpenChange}
          modal={false}
        >
          <Menu.Trigger
            ref={triggerRef}
            className={classNames(styles.menuTrigger, {
              [styles.menuTriggerActive]: matchingView !== null,
            })}
            aria-label={
              matchingView
                ? `Views, ${matchingView.name} selected`
                : "Views and filter actions"
            }
            disabled={disabled}
          >
            <span className={styles.menuTriggerIcon} aria-hidden>
              {matchingView ? <BookmarkIcon /> : <BookmarkOutlineIcon />}
            </span>
            <span
              className={styles.menuTriggerLabel}
              title={matchingView ? matchingView.name : undefined}
            >
              {triggerLabel}
            </span>
            <span className={styles.chevronIcon} aria-hidden>
              <Chevron />
            </span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              align="start"
              className={classNames(styles.positioner, {
                [styles.drawerPositioner]: variant === "drawer",
              })}
              sideOffset={8}
              style={positionerStyle}
            >
              <Menu.Popup
                className={classNames(styles.menu, {
                  [styles.drawerMenu]: variant === "drawer",
                })}
              >
                {emptyStateLabel ? (
                  <p className={styles.emptyState}>{emptyStateLabel}</p>
                ) : null}
                <Menu.RadioGroup
                  value={matchingView?.id ?? ""}
                  onValueChange={(viewId) => {
                    const view = filterViews.find((item) => item.id === viewId);
                    if (!view || matchingView?.id === view.id) {
                      return;
                    }

                    runAction(() => {
                      applyView(view);
                    });
                  }}
                >
                  {filterViews.map((view) => {
                    const isSelected = matchingView?.id === view.id;

                    return (
                      <Menu.RadioItem
                        key={view.id}
                        className={classNames(
                          styles.menuItem,
                          styles.menuItemView,
                        )}
                        label={view.name}
                        value={view.id}
                        onClick={() => {
                          if (!isSelected) {
                            return;
                          }

                          runAction(resetFilters);
                        }}
                      >
                        {isSelected ? (
                          <span className={styles.checkIcon} aria-hidden>
                            <CheckThinIcon strokeWidth={1.75} />
                          </span>
                        ) : null}
                        <span className={styles.menuItemText} title={view.name}>
                          {view.name}
                        </span>
                      </Menu.RadioItem>
                    );
                  })}
                </Menu.RadioGroup>
                <Menu.Separator className={styles.menuSeparator} />
                <Menu.Item
                  className={styles.menuItem}
                  disabled={!(canSaveCurrentView && canAddView)}
                  onClick={() => {
                    closeMenu();
                    setIsSaveDialogOpen(true);
                  }}
                >
                  Save current view…
                </Menu.Item>
                <Menu.LinkItem
                  closeOnClick
                  render={
                    <Link
                      href="/settings?section=filters"
                      className={styles.menuLink}
                    />
                  }
                  className={styles.menuItem}
                  onClick={closeMenu}
                >
                  Manage in Settings
                </Menu.LinkItem>
                <Menu.Separator className={styles.menuSeparator} />
                <Menu.Item
                  className={classNames(styles.menuItem, styles.menuItemReset)}
                  disabled={!hasActiveFilters}
                  onClick={() => {
                    runAction(resetFilters);
                  }}
                >
                  Reset filters
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      <SaveFilterViewDialog
        isOpen={isSaveDialogOpen}
        isSaving={isSavingPreferences}
        onClose={() => {
          setIsSaveDialogOpen(false);
        }}
        onSave={saveCurrentView}
      />
    </>
  );
};
