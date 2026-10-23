"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import { useCallback, useState } from "react";
import { CreatePlaylistDialog } from "src/components/CreatePlaylistDialog/CreatePlaylistDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import tracklistStyles from "src/components/ReleaseTracklist/ReleaseTracklist.module.css";
import { ReleaseTrackRowMenuPlaylistSubmenu } from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenuPlaylistSubmenu.component";
import { useReleaseTracklistAddAllPlaylistController } from "src/hooks/useReleaseTracklistAddAllPlaylistController.hook";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import { ListPlusThinIcon } from "src/styles/icons/ListPlusThinIcon.component";
import MenuIcon from "src/styles/icons/menu-thin.svg";
import styles from "./ReleaseTracklistAddAllMenu.module.css";

const ADD_ALL_MENU_LABEL = "Add all to";
const ADD_ALL_TRIGGER_LABEL = "Add all to…";

export interface ReleaseTracklistAddAllMenuProps {
  onAddAllToQueue: () => void;
  trackMetadataList: UserTrackMetadataBody[];
  releaseTitle: string;
  showPlaylistSubmenu: boolean;
  useOverlayStack?: boolean;
}

export const ReleaseTracklistAddAllMenu = ({
  onAddAllToQueue,
  trackMetadataList,
  releaseTitle,
  showPlaylistSubmenu,
  useOverlayStack = false,
}: ReleaseTracklistAddAllMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const { createDialogProps, submenuPanelProps } =
    useReleaseTracklistAddAllPlaylistController({
      trackMetadataList,
      releaseTitle,
      onRequestCloseMenu: closeMenu,
      useOverlayStack,
    });

  const handleAddAllToQueue = () => {
    onAddAllToQueue();
    closeMenu();
  };

  const playlistSubmenuVisible =
    showPlaylistSubmenu && trackMetadataList.length > 0;

  return (
    <>
      <div
        className={styles.menuHost}
        data-testid="fmdReleaseTracklistAddAllMenu"
      >
        <Menu.Root open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <Menu.Trigger
            render={(props) => (
              <IconButton
                {...props}
                ref={(node) => {
                  if (typeof props.ref === "function") {
                    props.ref(node);
                  } else if (props.ref) {
                    props.ref.current = node;
                  }
                }}
                variant="queue"
                type="button"
                className={classNames(
                  tracklistStyles.addAllButton,
                  styles.menuTrigger,
                )}
                iconClassName={classNames(
                  tracklistStyles.addAllButtonIcon,
                  styles.menuTriggerIcon,
                )}
                label={ADD_ALL_TRIGGER_LABEL}
                aria-haspopup="menu"
                aria-label={ADD_ALL_TRIGGER_LABEL}
                data-testid="fmdReleaseTracklistAddAllButton"
                onClick={(event) => {
                  event.stopPropagation();
                  props.onClick?.(event);
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          />
          <InlinePopoverMenu.Panel
            align="end"
            popupClassName={styles.menuPopup}
            portaled
            side="top"
            testId="fmdReleaseTracklistAddAllMenuPanel"
            useOverlayStack={useOverlayStack}
          >
            <InlinePopoverMenu.Heading className={styles.menuHeading}>
              {ADD_ALL_MENU_LABEL}
            </InlinePopoverMenu.Heading>
            <InlinePopoverMenu.List>
              <InlinePopoverMenu.Item
                label="Queue"
                className={styles.queueItem}
                closeOnClick={false}
                onClick={(event) => {
                  event.stopPropagation();
                  handleAddAllToQueue();
                }}
              >
                <span className={styles.queueItemIcon} aria-hidden>
                  <ListPlusThinIcon />
                </span>
                Queue
              </InlinePopoverMenu.Item>
              {playlistSubmenuVisible ? (
                <ReleaseTrackRowMenuPlaylistSubmenu
                  trackTitle={releaseTitle}
                  submenuLabel="Playlists"
                  submenuPanelProps={submenuPanelProps}
                />
              ) : null}
            </InlinePopoverMenu.List>
          </InlinePopoverMenu.Panel>
        </Menu.Root>
      </div>
      {playlistSubmenuVisible ? (
        <CreatePlaylistDialog {...createDialogProps} />
      ) : null}
    </>
  );
};
