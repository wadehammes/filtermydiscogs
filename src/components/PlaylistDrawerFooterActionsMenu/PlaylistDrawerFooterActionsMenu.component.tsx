"use client";

import { useMemo } from "react";
import { DrawerFooterMoreMenu } from "src/components/DrawerFooterMoreMenu/DrawerFooterMoreMenu.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import { InlinePopoverMenuItemIcon } from "src/components/InlinePopoverMenu/InlinePopoverMenuItemIcon.component";
import { MosaicExportMenuSubmenu } from "src/components/MosaicExportMenu/MosaicExportMenuSubmenu.component";
import { usePlaylistDrawerContext } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistShareControls } from "src/components/PlaylistShareControls/PlaylistShareControls.component";
import { useActivePlaylistDetail } from "src/hooks/useActivePlaylistDetail.hook";
import { useAllReleases } from "src/hooks/useFilterAtoms.hook";
import { useInlinePopoverMenuClose } from "src/hooks/useInlinePopoverMenuClose.hook";
import EditIcon from "src/styles/icons/edit-thin.svg";
import TableIcon from "src/styles/icons/table-thin.svg";
import TrashOpenIcon from "src/styles/icons/trash-open-thin.svg";
import { definedProps } from "src/utils/definedProps";
import { uniquePlaylistReleasesInOrder } from "src/utils/playlistMosaic";

interface PlaylistDrawerFooterActionsMenuProps {
  className?: string;
  hasDrawerStats: boolean;
  isBusy: boolean;
  onRename: () => void;
  onDelete: () => void;
  triggerClassName?: string;
  triggerIconClassName?: string;
  shareInMenu?: boolean;
}

export const PlaylistDrawerFooterActionsMenu = ({
  className,
  hasDrawerStats,
  isBusy,
  onRename,
  onDelete,
  triggerClassName,
  triggerIconClassName,
  shareInMenu = true,
}: PlaylistDrawerFooterActionsMenuProps) => {
  const { activePlaylistId, statsPanelOpen, setStatsPanelOpen } =
    usePlaylistDrawerContext();
  const { data: playlist } = useActivePlaylistDetail();
  const allReleases = useAllReleases();
  const playlistMosaicReleases = useMemo(() => {
    const releaseByInstanceId = new Map(
      allReleases.map((release) => [String(release.instance_id), release]),
    );

    return uniquePlaylistReleasesInOrder(
      playlist?.tracks ?? [],
      releaseByInstanceId,
    );
  }, [allReleases, playlist?.tracks]);
  const { closeMenu, isOpen, runAction, setIsOpen } =
    useInlinePopoverMenuClose();

  return (
    <DrawerFooterMoreMenu
      {...definedProps({
        className,
        triggerClassName,
        triggerIconClassName,
      })}
      disabled={!activePlaylistId || isBusy}
      footerInset={
        shareInMenu ? (
          <PlaylistShareControls variant="menu" onAfterCopy={closeMenu} />
        ) : undefined
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
      panelTestId="fmdPlaylistDrawerFooterActionsPopup"
      testId="fmdPlaylistDrawerFooterActionsMenu"
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
      <MosaicExportMenuSubmenu
        releases={playlistMosaicReleases}
        disabled={isBusy}
        {...definedProps({ fileNamePrefix: playlist?.name })}
        onAfterExport={closeMenu}
      />
    </DrawerFooterMoreMenu>
  );
};
