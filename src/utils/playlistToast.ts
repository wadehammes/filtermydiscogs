import { getPlaybackQueueToastPosition } from "src/utils/playbackQueueToast";
import { toast } from "src/utils/toast";

const playlistToastOptions = () => ({
  position: getPlaybackQueueToastPosition(),
});

export const showPlaylistTrackAddedToast = (playlistName: string): void => {
  toast.success(`Added to ${playlistName}`, playlistToastOptions());
};
