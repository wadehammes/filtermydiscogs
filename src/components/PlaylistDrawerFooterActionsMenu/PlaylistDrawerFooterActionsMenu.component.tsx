"use client";

import { DrawerFooterMoreMenu } from "src/components/DrawerFooterMoreMenu/DrawerFooterMoreMenu.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { InlinePopoverMenuItemIcon } from "src/components/InlinePopoverMenu/InlinePopoverMenuItemIcon.component";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistShareControls } from "src/components/PlaylistShareControls/PlaylistShareControls.component";
import { useInlinePopoverMenuClose } from "src/hooks/useInlinePopoverMenuClose.hook";
import EditIcon from "src/styles/icons/edit-thin.svg";
import TableIcon from "src/styles/icons/table-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import { definedProps } from "src/utils/definedProps";

interface PlaylistDrawerFooterActionsMenuProps {
  className?: string;
  hasDrawerStats: boolean;
  isBusy: boolean;
  layout?: "edit" | "more";
  onRename: () => void;
  onDelete: () => void;
  triggerClassName?: string;
  triggerIconClassName?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const PlaylistDrawerFooterActionsMenu = ({
  className,
  hasDrawerStats,
  isBusy,
  layout = "more",
  onRename,
  onDelete,
  triggerClassName,
  triggerIconClassName,
  isOpen: isOpenProp,
  onOpenChange: onOpenChangeProp,
}: PlaylistDrawerFooterActionsMenuProps) => {
  const { activePlaylistId, statsPanelOpen, setStatsPanelOpen } =
    usePlaylistDrawerContext();
  const menuClose = useInlinePopoverMenuClose();
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : menuClose.isOpen;

  const setIsOpen = (open: boolean) => {
    if (isControlled) {
      onOpenChangeProp?.(open);
    } else {
      menuClose.setIsOpen(open);
    }
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const runAction = (action: () => void) => {
    closeMenu();
    action();
  };

  const isEditLayout = layout === "edit";

  return (
    <DrawerFooterMoreMenu
      {...definedProps({
        className,
        triggerClassName,
        triggerIconClassName,
      })}
      disabled={!activePlaylistId || isBusy}
      footerInset={
        isEditLayout ? undefined : (
          <PlaylistShareControls variant="menu" onAfterCopy={closeMenu} />
        )
      }
      isOpen={isOpen}
      menuFooter={
        <InlinePopoverMenu.ItemDanger
          disabled={isBusy}
          onClick={() => {
            runAction(onDelete);
          }}
        >
          <InlinePopoverMenuItemIcon>
            <TrashOpenIcon />
          </InlinePopoverMenuItemIcon>
          <span>Delete</span>
        </InlinePopoverMenu.ItemDanger>
      }
      onOpenChange={setIsOpen}
      panelTestId={
        isEditLayout
          ? "fmdPlaylistDrawerEditMenu"
          : "fmdPlaylistDrawerFooterActionsPopup"
      }
      testId={
        isEditLayout
          ? "fmdPlaylistDrawerEditMenuTrigger"
          : "fmdPlaylistDrawerFooterActionsMenu"
      }
      triggerIcon={isEditLayout ? <EditIcon /> : undefined}
      triggerLabel={isEditLayout ? "Edit" : "More"}
    >
      <InlinePopoverMenu.Item
        disabled={isBusy}
        onClick={() => {
          runAction(onRename);
        }}
      >
        <InlinePopoverMenuItemIcon>
          <EditIcon />
        </InlinePopoverMenuItemIcon>
        <span>Rename</span>
      </InlinePopoverMenu.Item>
      {isEditLayout ? null : (
        <InlinePopoverMenu.Item
          disabled={!hasDrawerStats}
          onClick={() => {
            runAction(() => {
              setStatsPanelOpen(!statsPanelOpen);
            });
          }}
        >
          <InlinePopoverMenuItemIcon>
            <TableIcon />
          </InlinePopoverMenuItemIcon>
          <span>{statsPanelOpen ? "Hide stats" : "Stats"}</span>
        </InlinePopoverMenu.Item>
      )}
    </DrawerFooterMoreMenu>
  );
};
