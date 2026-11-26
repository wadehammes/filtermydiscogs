"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateReleasePackedToggleIcon } from "src/components/Crates/CrateReleasePackedToggleIcon.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { InlinePopoverMenuItemIcon } from "src/components/InlinePopoverMenu/InlinePopoverMenuItemIcon.component";
import { useInlinePopoverMenuClose } from "src/hooks/useInlinePopoverMenuClose.hook";
import EllipsisHorizontalIcon from "src/styles/icons/ellipsis-horizontal-thin.svg";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import rowMenuStyles from "src/styles/modules/drawer-row-ellipsis-menu.module.css";

interface CrateDrawerReleaseRowMenuProps {
  packed: boolean;
  releaseTitle: string;
  onPackedChange: (packed: boolean) => void;
  onRemove: () => void;
  triggerClassName?: string;
}

export const CrateDrawerReleaseRowMenu = ({
  packed,
  releaseTitle,
  onPackedChange,
  onRemove,
  triggerClassName,
}: CrateDrawerReleaseRowMenuProps) => {
  const { packedEnabled } = useCrateDrawerContext();
  const { isOpen, runAction, setIsOpen } = useInlinePopoverMenuClose();

  return (
    <div
      className={rowMenuStyles.menuRoot}
      data-testid="fmdCrateDrawerReleaseRowMenu"
    >
      <Menu.Root open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <Menu.Trigger
          render={(props) => (
            <IconButton
              {...props}
              className={classNames(
                rowMenuStyles.menuTrigger,
                triggerClassName,
              )}
              iconClassName={rowMenuStyles.menuTriggerIcon}
              aria-label={`Actions for ${releaseTitle}`}
            >
              <EllipsisHorizontalIcon />
            </IconButton>
          )}
        />
        <InlinePopoverMenu.Panel
          align="end"
          popupClassName={rowMenuStyles.menuPopup}
          portaled
          useOverlayStack
        >
          <InlinePopoverMenu.List>
            {packedEnabled ? (
              <InlinePopoverMenu.Item
                onClick={() => {
                  runAction(() => {
                    onPackedChange(!packed);
                  });
                }}
              >
                <InlinePopoverMenuItemIcon>
                  <CrateReleasePackedToggleIcon packed={packed} />
                </InlinePopoverMenuItemIcon>
                <span>
                  {packed
                    ? "Unmark as packed for gig"
                    : "Mark as packed for gig"}
                </span>
              </InlinePopoverMenu.Item>
            ) : null}
            <InlinePopoverMenu.ItemDanger
              onClick={() => {
                runAction(onRemove);
              }}
            >
              <InlinePopoverMenuItemIcon>
                <MinusIcon />
              </InlinePopoverMenuItemIcon>
              <span>Remove from crate</span>
            </InlinePopoverMenu.ItemDanger>
          </InlinePopoverMenu.List>
        </InlinePopoverMenu.Panel>
      </Menu.Root>
    </div>
  );
};
