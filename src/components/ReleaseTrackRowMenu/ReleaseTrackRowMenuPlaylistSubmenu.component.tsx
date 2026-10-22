"use client";

import { Menu } from "@base-ui/react/menu";
import {
  ReleasePlaylistPickerSubmenuPanel,
  type ReleasePlaylistPickerSubmenuPanelProps,
  ReleasePlaylistPickerSubmenuTrigger,
} from "src/components/ReleasePlaylistPickerDialog/ReleasePlaylistPickerDialog.component";
import { definedProps } from "src/utils/definedProps";

export type ReleaseTrackRowMenuPlaylistSubmenuProps = {
  trackTitle: string;
  submenuPanelProps: ReleasePlaylistPickerSubmenuPanelProps;
  submenuLabel?: string;
  openOnHover?: boolean;
};

export const ReleaseTrackRowMenuPlaylistSubmenu = ({
  trackTitle,
  submenuPanelProps,
  submenuLabel,
  openOnHover,
}: ReleaseTrackRowMenuPlaylistSubmenuProps) => (
  <Menu.SubmenuRoot>
    <ReleasePlaylistPickerSubmenuTrigger
      trackTitle={trackTitle}
      {...definedProps({ submenuLabel, openOnHover })}
    />
    <ReleasePlaylistPickerSubmenuPanel {...submenuPanelProps} />
  </Menu.SubmenuRoot>
);
