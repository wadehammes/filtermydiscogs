"use client";

import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import type { MouseEvent } from "react";
import { useCallback, useState } from "react";
import { CreateCrateDialog } from "src/components/CreateCrateDialog/CreateCrateDialog.component";
import { IconButton } from "src/components/IconButton/IconButton.component";
import { InlinePopoverMenu } from "src/components/InlinePopoverMenu/InlinePopoverMenu.component";
import {
  ReleaseCrateMenuSubmenuPanel,
  ReleaseCrateMenuSubmenuTrigger,
} from "src/components/ReleaseCard/ReleaseCrateMenuSubmenu.component";
import {
  ReleasePlaylistPickerSubmenuPanel,
  ReleasePlaylistPickerSubmenuTrigger,
} from "src/components/ReleasePlaylistPickerDialog/ReleasePlaylistPickerDialog.component";
import { useFeatureFlag } from "src/context/featureFlags.context";
import { useReleaseCrateMenuController } from "src/hooks/useReleaseCrateMenuController.hook";
import type { UserTrackMetadataBody } from "src/lib/validation/userTrack.schemas";
import MinusIcon from "src/styles/icons/minus-thin.svg";
import PlusIcon from "src/styles/icons/plus-thin.svg";
import stackStyles from "src/styles/modules/vertical-action-stack.module.css";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleaseMiniPlayerAddToMenu.module.css";

const ADD_TO_MENU_LABEL = "Add to";

export interface ReleaseMiniPlayerAddToMenuProps {
  release: DiscogsRelease;
  playlistMetadata?: UserTrackMetadataBody;
  trackTitle: string;
  actionClass: (active?: boolean) => string;
  slotClass?: string;
}

export const ReleaseMiniPlayerAddToMenu = ({
  release,
  playlistMetadata,
  trackTitle,
  actionClass,
  slotClass = "",
}: ReleaseMiniPlayerAddToMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);
  const {
    isLoading,
    isCrateActionPending,
    showCreateDialog,
    closeCreateDialog,
    prefetchMembership,
    handleCreateCrate,
    panelContentProps,
  } = useReleaseCrateMenuController(release, isOpen, closeMenu);
  const { inActiveCrate } = panelContentProps;
  const playlistsEnabled = useFeatureFlag("playlists");

  const handleTriggerClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <>
      <div
        className={classNames(slotClass, styles.menuHost)}
        data-testid="fmdReleaseAddToMenuHost"
      >
        <Menu.Root open={isOpen} onOpenChange={setIsOpen} modal={false}>
          <Menu.Trigger
            render={(props) => (
              <IconButton
                {...props}
                variant={inActiveCrate ? "minus" : "plus"}
                type="button"
                className={classNames(
                  styles.menuRoot,
                  actionClass(inActiveCrate),
                )}
                iconClassName={stackStyles.actionIcon}
                aria-haspopup="menu"
                aria-label={ADD_TO_MENU_LABEL}
                aria-pressed={inActiveCrate}
                disabled={isLoading || isCrateActionPending}
                onClick={handleTriggerClick}
                onFocus={prefetchMembership}
                onPointerDown={prefetchMembership}
                onPointerEnter={prefetchMembership}
                data-testid="fmdReleaseAddToMenuTrigger"
              >
                {inActiveCrate ? <MinusIcon /> : <PlusIcon />}
              </IconButton>
            )}
          />
          <InlinePopoverMenu.Panel
            align="end"
            popupClassName={styles.menuPopup}
            portaled
            side="top"
            testId="fmdReleaseAddToMenu"
            useOverlayStack
          >
            <InlinePopoverMenu.Heading className={styles.menuHeading}>
              {ADD_TO_MENU_LABEL}
            </InlinePopoverMenu.Heading>
            <InlinePopoverMenu.List>
              <Menu.SubmenuRoot>
                <ReleaseCrateMenuSubmenuTrigger
                  inActiveCrate={inActiveCrate}
                  openOnHover={false}
                />
                <ReleaseCrateMenuSubmenuPanel
                  panelContentProps={panelContentProps}
                />
              </Menu.SubmenuRoot>
              {playlistMetadata && playlistsEnabled ? (
                <Menu.SubmenuRoot>
                  <ReleasePlaylistPickerSubmenuTrigger
                    trackTitle={trackTitle}
                    submenuLabel="Playlists"
                    openOnHover={false}
                  />
                  <ReleasePlaylistPickerSubmenuPanel
                    metadata={playlistMetadata}
                    trackTitle={trackTitle}
                  />
                </Menu.SubmenuRoot>
              ) : null}
            </InlinePopoverMenu.List>
          </InlinePopoverMenu.Panel>
        </Menu.Root>
      </div>
      <CreateCrateDialog
        isOpen={showCreateDialog}
        isSubmitting={isCrateActionPending}
        onClose={closeCreateDialog}
        onCreate={handleCreateCrate}
      />
    </>
  );
};
