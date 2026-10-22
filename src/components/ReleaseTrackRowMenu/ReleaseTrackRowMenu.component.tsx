"use client";

import {
  type ReleaseTrackRowMenuProps,
  ReleaseTrackRowMenuView,
} from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenuView.component";
import { ReleaseTrackRowMenuWithPlaylist } from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenuWithPlaylist.component";

export type { ReleaseTrackRowMenuProps } from "src/components/ReleaseTrackRowMenu/ReleaseTrackRowMenuView.component";

export const ReleaseTrackRowMenu = (props: ReleaseTrackRowMenuProps) => {
  if (props.playlistPickerMetadata) {
    return (
      <ReleaseTrackRowMenuWithPlaylist
        {...props}
        playlistPickerMetadata={props.playlistPickerMetadata}
      />
    );
  }

  return <ReleaseTrackRowMenuView {...props} />;
};
