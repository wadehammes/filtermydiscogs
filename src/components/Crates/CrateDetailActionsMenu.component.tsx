"use client";

import classNames from "classnames";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { focusCrateSetNotesScratchpad } from "src/components/Crates/CrateSetNotesScratchpad.component";
import EditIcon from "src/styles/icons/edit-thin.svg";
import MenuIcon from "src/styles/icons/menu-thin.svg";
import NoteStickyIcon from "src/styles/icons/note-sticky-thin.svg";
import StarIcon from "src/styles/icons/star-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import styles from "./CrateDetailActionsMenu.module.css";

export const CrateDetailActionsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    activeCrateId,
    handleCopyLink,
    handlePrivacyToggle,
    isDefaultCrate,
    isDeletingCrate,
    isPublic,
    isUpdatingCrate,
    selectedReleases,
    setShowClearDialog,
    setShowEditCrateDialog,
    setShowMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      closeMenu();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  const runAction = (action: () => void) => {
    closeMenu();
    action();
  };

  return (
    <div
      className={styles.menuRoot}
      ref={containerRef}
      data-testid="fmdCrateDetailHeaderActions"
    >
      <button
        type="button"
        className={styles.menuTrigger}
        aria-label="Crate actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={!activeCrateId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <MenuIcon className={styles.menuTriggerIcon} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className={styles.menu} role="menu" aria-label="Crate actions">
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            disabled={!activeCrateId || isBusy}
            onClick={() => runAction(() => setShowEditCrateDialog(true))}
          >
            <span className={styles.menuItemIcon} aria-hidden="true">
              <EditIcon />
            </span>
            Edit crate
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.menuItem}
            disabled={!activeCrateId || isBusy}
            onClick={() => runAction(focusCrateSetNotesScratchpad)}
          >
            <span className={styles.menuItemIcon} aria-hidden="true">
              <NoteStickyIcon />
            </span>
            Set notes
          </button>
          {!isDefaultCrate ? (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              disabled={isBusy}
              onClick={() => runAction(() => setShowMakeDefaultDialog(true))}
            >
              <span className={styles.menuItemIcon} aria-hidden="true">
                <StarIcon />
              </span>
              {isUpdatingCrate ? "Setting default…" : "Set as default"}
            </button>
          ) : null}
          <hr className={styles.menuSeparator} />
          <label className={styles.menuItemCheckbox}>
            <input
              type="checkbox"
              role="menuitemcheckbox"
              aria-checked={isPublic}
              className={styles.menuCheckbox}
              checked={isPublic}
              disabled={isBusy || !activeCrateId}
              onChange={() => void handlePrivacyToggle()}
            />
            <span>Make shareable</span>
          </label>
          {isPublic && activeCrateId ? (
            <button
              type="button"
              role="menuitem"
              className={styles.menuItem}
              disabled={isBusy}
              onClick={() => runAction(() => void handleCopyLink())}
            >
              Copy link
            </button>
          ) : null}
          <hr className={styles.menuSeparator} />
          <button
            type="button"
            role="menuitem"
            className={classNames(styles.menuItem, styles.menuItemDanger)}
            disabled={releaseCount === 0 || isBusy}
            onClick={() => runAction(() => setShowClearDialog(true))}
          >
            <span className={styles.menuItemIcon} aria-hidden="true">
              <TrashOpenIcon />
            </span>
            Empty crate
          </button>
        </div>
      ) : null}
    </div>
  );
};
