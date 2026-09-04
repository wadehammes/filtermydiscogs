"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { useCloseMenuWhenFiltersBarHidden } from "src/components/FilterViewsMenu/useCloseMenuWhenFiltersBarHidden.hook";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { SaveFilterViewDialog } from "src/components/SaveFilterViewDialog/SaveFilterViewDialog.component";
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
  const isDrawerVariant = variant === "drawer";
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

  const handleMenuOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
  }, []);

  const runAction = useCallback(
    (action: () => void) => {
      closeMenu();
      action();
    },
    [closeMenu],
  );

  const emptyStateLabel =
    filterViews.length === 0 ? "No saved views yet" : null;

  const menuPanel = (
    <>
      <InlinePopoverMenu.List>
        {emptyStateLabel ? (
          <p className={inlinePopoverMenuStyles.empty}>{emptyStateLabel}</p>
        ) : null}
        <Menu.RadioGroup
          className={inlinePopoverMenuStyles.itemGroup}
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
                  inlinePopoverMenuStyles.item,
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
      </InlinePopoverMenu.List>
      <InlinePopoverMenu.Footer>
        <InlinePopoverMenu.Item
          disabled={!(canSaveCurrentView && canAddView)}
          onClick={() => {
            closeMenu();
            setIsSaveDialogOpen(true);
          }}
        >
          Save current view…
        </InlinePopoverMenu.Item>
        <Menu.LinkItem
          closeOnClick
          render={
            <Link
              href="/settings?section=filters"
              className={inlinePopoverMenuStyles.link}
            />
          }
          className={inlinePopoverMenuStyles.item}
          onClick={closeMenu}
        >
          Manage in Settings
        </Menu.LinkItem>
      </InlinePopoverMenu.Footer>
      <InlinePopoverMenu.Footer>
        <InlinePopoverMenu.ItemNeutral
          disabled={!hasActiveFilters}
          onClick={() => {
            runAction(resetFilters);
          }}
        >
          Reset filters
        </InlinePopoverMenu.ItemNeutral>
      </InlinePopoverMenu.Footer>
    </>
  );

  return (
    <>
      <div
        className={classNames(styles.menuRoot, className, {
          [styles.drawerVariant]: isDrawerVariant,
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
          <InlinePopoverMenu.Panel
            align="start"
            popupClassName={
              isDrawerVariant ? styles.drawerMenuPopup : styles.menuPopup
            }
            positionerClassName={classNames({
              [styles.drawerPositioner]: isDrawerVariant,
            })}
            scrollable
            side="bottom"
            sideOffset={isDrawerVariant ? 0 : 8}
          >
            {menuPanel}
          </InlinePopoverMenu.Panel>
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
