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
import menuStyles from "src/styles/modules/inline-popover-menu.module.css";
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
            className={menuStyles.positioner}
            sideOffset={8}
          >
            <Menu.Popup className={styles.menuPopup}>
              <div className={styles.menuList}>
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
                  <span className={styles.menuItemLabel}>Edit crate</span>
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
                    <span className={styles.menuItemLabel}>
                      {isUpdatingCrate ? "Setting default…" : "Set as default"}
                    </span>
                  </Menu.Item>
                ) : null}
              </div>
              <div className={styles.menuFooter}>
                <Menu.Item
                  className={classNames(styles.menuItemDanger, {
                    [styles.menuItemDangerMultiline]:
                      deleteBlockedReason !== null,
                  })}
                  disabled={isDeleteDisabled}
                  title={deleteBlockedReason ?? undefined}
                  onClick={() => {
                    runAction(() => {
                      setShowDeleteDialog(true);
                    });
                  }}
                >
                  <span className={styles.menuItemIcon} aria-hidden="true">
                    <TrashOpenIcon />
                  </span>
                  <span className={styles.menuItemContent}>
                    <span className={styles.menuItemLabel}>Delete crate</span>
                    {deleteBlockedReason ? (
                      <span className={styles.menuItemHint}>
                        {deleteBlockedReason}
                      </span>
                    ) : null}
                  </span>
                </Menu.Item>
              </div>
              <div className={styles.menuFooterInset}>
                <CrateShareControls variant="menu" onAfterCopy={closeMenu} />
              </div>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  );
};
