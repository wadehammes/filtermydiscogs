import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { formatArtistNames } from "src/utils/releaseDisplay";
import { formatTrackPositionTitle } from "src/utils/userTrack";

export const isQueueItemTrackTitlePlaceholder = (
  item: Pick<PlaybackQueueItem, "trackTitle" | "trackPosition">,
): boolean => item.trackTitle.trim() === item.trackPosition.trim();

export const resolveQueueItemYoutubeVideoId = (
  item: Pick<PlaybackQueueItem, "youtubeVideoId">,
): string | undefined => {
  const trimmed = item.youtubeVideoId?.trim();

  return trimmed ? trimmed : undefined;
};

export const resolvePlaybackPresentationFromQueueItem = (
  item: PlaybackQueueItem,
): { trackTitle: string; artistLabel: string } => {
  const artistFromItem = item.artist?.trim();

  return {
    trackTitle: isQueueItemTrackTitlePlaceholder(item)
      ? item.trackPosition.trim()
      : formatTrackPositionTitle(item.trackPosition, item.trackTitle),
    artistLabel: artistFromItem || formatArtistNames(item.release),
  };
};
