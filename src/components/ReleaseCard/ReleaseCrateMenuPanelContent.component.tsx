"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import type { RefObject } from "react";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { ReleaseCrateMenuCheckboxItem } from "src/components/ReleaseCard/ReleaseCrateMenuCheckboxItem.component";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import styles from "./ReleaseCrateMenu.module.css";

interface CrateRow {
  id: string;
  name: string;
}

interface ScrollFadeState {
  top: boolean;
  bottom: boolean;
}

interface ReleaseCrateMenuPanelContentProps {
  inActiveCrate: boolean;
  activeCrate: CrateRow | null;
  otherCrates: CrateRow[];
  cratesCount: number;
  memberCrateIds: Set<string>;
  showToggleAllAction: boolean;
  isInAllCrates: boolean;
  isCrateActionPending: boolean;
  crateListScrollRef: RefObject<HTMLDivElement | null>;
  crateListScrollFade: ScrollFadeState;
  updateCrateListScrollFade: () => void;
  onCheckedChange: (crateId: string, checked: boolean) => void;
  onToggleAllCrates: () => void;
  onOpenCreateDialog: () => void;
}

export const ReleaseCrateMenuPanelContent = ({
  inActiveCrate,
  activeCrate,
  otherCrates,
  cratesCount,
  memberCrateIds,
  showToggleAllAction,
  isInAllCrates,
  isCrateActionPending,
  crateListScrollRef,
  crateListScrollFade,
  updateCrateListScrollFade,
  onCheckedChange,
  onToggleAllCrates,
  onOpenCreateDialog,
}: ReleaseCrateMenuPanelContentProps) => (
  <>
    <p className={styles.menuHeading}>
      {inActiveCrate ? "Manage crates" : "Add to crates"}
    </p>
    {activeCrate ? (
      <div className={styles.menuSection}>
        <ReleaseCrateMenuCheckboxItem
          crateId={activeCrate.id}
          crateName={activeCrate.name}
          isMember={memberCrateIds.has(activeCrate.id)}
          showCurrentLabel
          onCheckedChange={onCheckedChange}
        />
      </div>
    ) : null}
    {otherCrates.length > 0 ? (
      <div
        className={classNames(styles.crateListScrollWrap, {
          [styles.crateListScrollFadeTop]: crateListScrollFade.top,
          [styles.crateListScrollFadeBottom]: crateListScrollFade.bottom,
          [styles.crateListScrollWrapSeparated]: activeCrate !== null,
        })}
      >
        <div
          ref={crateListScrollRef}
          className={styles.crateListScroll}
          onScroll={updateCrateListScrollFade}
        >
          <div className={styles.menuSection}>
            {otherCrates.map((crate) => (
              <ReleaseCrateMenuCheckboxItem
                key={crate.id}
                crateId={crate.id}
                crateName={crate.name}
                isMember={memberCrateIds.has(crate.id)}
                onCheckedChange={onCheckedChange}
              />
            ))}
          </div>
        </div>
      </div>
    ) : cratesCount === 0 ? (
      <p
        className={classNames(inlinePopoverMenuStyles.empty, styles.menuEmpty)}
      >
        No crates yet
      </p>
    ) : null}
    {showToggleAllAction ? (
      <InlinePopoverMenu.Footer className={styles.menuFooter}>
        <Menu.Item
          className={classNames(
            inlinePopoverMenuStyles.item,
            styles.crateMenuItem,
          )}
          closeOnClick={false}
          data-testid="fmdReleaseCrateMenuToggleAll"
          disabled={isCrateActionPending}
          onClick={(event) => {
            event.stopPropagation();
            onToggleAllCrates();
          }}
        >
          {isInAllCrates ? "Remove from all" : "Add to all"}
        </Menu.Item>
      </InlinePopoverMenu.Footer>
    ) : null}
    <InlinePopoverMenu.Footer className={styles.menuFooter}>
      <Menu.Item
        className={classNames(
          inlinePopoverMenuStyles.item,
          styles.crateMenuItem,
        )}
        disabled={isCrateActionPending}
        onClick={onOpenCreateDialog}
      >
        <span className={styles.menuItemIcon} aria-hidden="true">
          <PlusIcon />
        </span>
        Add to new crate
      </Menu.Item>
    </InlinePopoverMenu.Footer>
  </>
);
