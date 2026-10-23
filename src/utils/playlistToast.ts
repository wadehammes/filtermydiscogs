import { getPlaybackQueueToastPosition } from "src/utils/playbackQueueToast";
import { toast } from "src/utils/toast";

const playlistToastOptions = () => ({
  position: getPlaybackQueueToastPosition(),
});

export const showPlaylistTrackAddedToast = (playlistName: string): void => {
  toast.success(`Added to ${playlistName}`, playlistToastOptions());
};

export const showPlaylistTrackRemovedToast = (playlistName: string): void => {
  toast.success(`Removed from ${playlistName}`, playlistToastOptions());
};

export const showPlaylistTracksAddedToast = (
  trackCount: number,
  playlistName: string,
): void => {
  const label =
    trackCount === 1
      ? `Added 1 track to ${playlistName}`
      : `Added ${trackCount} tracks to ${playlistName}`;

  toast.success(label, playlistToastOptions());
};
