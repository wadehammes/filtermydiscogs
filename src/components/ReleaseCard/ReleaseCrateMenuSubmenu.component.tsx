"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import {
  InlinePopoverMenu,
  inlinePopoverMenuStyles,
} from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import {
  ReleaseCrateMenuPanelContent,
  type ReleaseCrateMenuPanelContentProps,
} from "src/components/ReleaseCard/ReleaseCrateMenuPanelContent.component";
import { ChevronRightThinIcon } from "src/styles/icons/ChevronRightThinIcon.component";
import CratesIcon from "src/styles/icons/crates-thin.svg";
import { definedProps } from "src/utils/definedProps";
import styles from "./ReleaseCrateMenu.module.css";
import submenuStyles from "./ReleaseCrateMenuSubmenu.module.css";

export interface ReleaseCrateMenuSubmenuTriggerProps {
  inActiveCrate: boolean;
  openOnHover?: boolean;
}

export const ReleaseCrateMenuSubmenuTrigger = ({
  inActiveCrate,
  openOnHover,
}: ReleaseCrateMenuSubmenuTriggerProps) => (
  <Menu.SubmenuTrigger
    className={classNames(inlinePopoverMenuStyles.item, submenuStyles.trigger)}
    aria-label={inActiveCrate ? "Manage crates" : "Add to crates"}
    {...definedProps({ openOnHover })}
  >
    <span className={submenuStyles.triggerIcon} aria-hidden>
      <CratesIcon />
    </span>
    <span className={submenuStyles.triggerLabel}>Crates</span>
    <ChevronRightThinIcon
      className={submenuStyles.triggerChevron}
      aria-hidden
    />
  </Menu.SubmenuTrigger>
);

export type ReleaseCrateMenuSubmenuPanelProps = {
  panelContentProps: ReleaseCrateMenuPanelContentProps;
  useOverlayStack?: boolean;
};

export const ReleaseCrateMenuSubmenuPanel = ({
  panelContentProps,
  useOverlayStack = false,
}: ReleaseCrateMenuSubmenuPanelProps) => (
  <InlinePopoverMenu.Panel
    variant="submenu"
    scrollable
    popupClassName={classNames(styles.menuPopup, submenuStyles.submenuPopup)}
    testId="fmdReleaseCrateMenu"
    useOverlayStack={useOverlayStack}
  >
    <InlinePopoverMenu.Heading className={submenuStyles.submenuHeading}>
      {panelContentProps.inActiveCrate ? "Manage crates" : "Crates"}
    </InlinePopoverMenu.Heading>
    <ReleaseCrateMenuPanelContent
      {...panelContentProps}
      showTopHeading={false}
    />
  </InlinePopoverMenu.Panel>
);
