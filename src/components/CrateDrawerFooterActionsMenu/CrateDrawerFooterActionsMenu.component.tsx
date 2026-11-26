"use client";

import { useCrateDrawerContext } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateShareControls } from "src/components/CrateShareControls/CrateShareControls.component";
import { DrawerFooterMoreMenu } from "src/components/DrawerFooterMoreMenu/DrawerFooterMoreMenu.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { InlinePopoverMenuItemIcon } from "src/components/InlinePopoverMenu/InlinePopoverMenuItemIcon.component";
import { MosaicExportMenuSubmenu } from "src/components/MosaicExportMenu/MosaicExportMenuSubmenu.component";
import { useInlinePopoverMenuClose } from "src/hooks/useInlinePopoverMenuClose.hook";
import StarIcon from "src/styles/icons/star-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import { definedProps } from "src/utils/definedProps";

interface CrateDrawerFooterActionsMenuProps {
  className?: string;
  shareInMenu?: boolean;
  triggerClassName?: string;
  triggerIconClassName?: string;
}

export const CrateDrawerFooterActionsMenu = ({
  className,
  shareInMenu = true,
  triggerClassName,
  triggerIconClassName,
}: CrateDrawerFooterActionsMenuProps) => {
  const { closeMenu, isOpen, runAction, setIsOpen } =
    useInlinePopoverMenuClose();
  const {
    activeCrateId,
    isDefaultCrate,
    isDeletingCrate,
    isUpdatingCrate,
    selectedReleases,
    crateName,
    setShowClearDialog,
    setShowMakeDefaultDialog,
  } = useCrateDrawerContext();

  const releaseCount = selectedReleases.length;
  const isBusy = isUpdatingCrate || isDeletingCrate;

  return (
    <DrawerFooterMoreMenu
      {...definedProps({
        className,
        triggerClassName,
        triggerIconClassName,
      })}
      disabled={!activeCrateId || isBusy}
      footerInset={
        shareInMenu ? (
          <CrateShareControls variant="menu" onAfterCopy={closeMenu} />
        ) : undefined
      }
      isOpen={isOpen}
      menuFooter={
        <InlinePopoverMenu.ItemDanger
          disabled={releaseCount === 0 || isBusy}
          onClick={() => {
            runAction(() => {
              setShowClearDialog(true);
            });
          }}
        >
          <InlinePopoverMenuItemIcon>
            <TrashOpenIcon />
          </InlinePopoverMenuItemIcon>
          <span>Empty</span>
        </InlinePopoverMenu.ItemDanger>
      }
      onOpenChange={setIsOpen}
      panelTestId="fmdCrateDrawerFooterActionsPopup"
      testId="fmdCrateDrawerFooterActionsMenu"
    >
      {!isDefaultCrate ? (
        <InlinePopoverMenu.Item
          disabled={isBusy}
          onClick={() => {
            runAction(() => {
              setShowMakeDefaultDialog(true);
            });
          }}
        >
          <InlinePopoverMenuItemIcon>
            <StarIcon />
          </InlinePopoverMenuItemIcon>
          <span>{isUpdatingCrate ? "Default…" : "Default"}</span>
        </InlinePopoverMenu.Item>
      ) : null}
      <MosaicExportMenuSubmenu
        releases={selectedReleases}
        disabled={isBusy}
        fileNamePrefix={crateName}
        onAfterExport={closeMenu}
      />
    </DrawerFooterMoreMenu>
  );
};
