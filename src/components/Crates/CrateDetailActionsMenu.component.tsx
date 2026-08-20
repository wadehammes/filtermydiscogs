"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { useCallback, useState } from "react";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateShareControls } from "src/components/CrateShareControls/CrateShareControls.component";
import EditIcon from "src/styles/icons/edit-thin.svg";
import MenuIcon from "src/styles/icons/menu-thin.svg";
import StarIcon from "src/styles/icons/star-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import styles from "./CrateDetailActionsMenu.module.css";

export const CrateDetailActionsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    activeCrateId,
    deleteBlockedReason,
    isDefaultCrate,
    isDeletingCrate,
    isUpdatingCrate,
    setShowDeleteDialog,
    setShowEditCrateDialog,
    setShowMakeDefaultDialog,
  } = useCrateDrawerContext();

  const isBusy = isUpdatingCrate || isDeletingCrate;
  const isDeleteDisabled = isBusy || deleteBlockedReason !== null;

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const runAction = useCallback(
    (action: () => void) => {
      closeMenu();
      action();
    },
    [closeMenu],
  );

  return (
    <div className={styles.menuRoot} data-testid="fmdCrateDetailHeaderActions">
      <Menu.Root open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <Menu.Trigger
          className={styles.menuTrigger}
          aria-label="Crate actions"
          disabled={!activeCrateId}
        >
          <MenuIcon className={styles.menuTriggerIcon} aria-hidden="true" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner
            align="end"
            className={styles.positioner}
            sideOffset={8}
          >
            <Menu.Popup className={styles.menu}>
              <Menu.Item
                className={styles.menuItem}
                disabled={!activeCrateId || isBusy}
                onClick={() => {
                  runAction(() => {
                    setShowEditCrateDialog(true);
                  });
                }}
              >
                <span className={styles.menuItemIcon} aria-hidden="true">
                  <EditIcon />
                </span>
                Edit crate
              </Menu.Item>
              {!isDefaultCrate ? (
                <Menu.Item
                  className={styles.menuItem}
                  disabled={isBusy}
                  onClick={() => {
                    runAction(() => {
                      setShowMakeDefaultDialog(true);
                    });
                  }}
                >
                  <span className={styles.menuItemIcon} aria-hidden="true">
                    <StarIcon />
                  </span>
                  {isUpdatingCrate ? "Setting default…" : "Set as default"}
                </Menu.Item>
              ) : null}
              <Menu.Separator className={styles.menuSeparator} />
              <Menu.Item
                className={classNames(styles.menuItem, styles.menuItemDanger)}
                disabled={isDeleteDisabled}
                title={deleteBlockedReason ?? undefined}
                onClick={() => {
                  runAction(() => {
                    setShowDeleteDialog(true);
                  });
                }}
              >
                <span className={styles.menuItemLeading}>
                  <span className={styles.menuItemIcon} aria-hidden="true">
                    <TrashOpenIcon />
                  </span>
                  <span className={styles.menuItemText}>
                    <span>Delete crate</span>
                    {deleteBlockedReason ? (
                      <span className={styles.menuItemHint}>
                        {deleteBlockedReason}
                      </span>
                    ) : null}
                  </span>
                </span>
              </Menu.Item>
              <Menu.Separator className={styles.menuSeparator} />
              <CrateShareControls variant="menu" onAfterCopy={closeMenu} />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
};
