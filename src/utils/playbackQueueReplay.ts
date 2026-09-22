import type { DiscogsRelease } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { isSameReleaseInstance } from "src/utils/releaseNotes";
import { parseYoutubeVideoId } from "src/utils/releasePlayback";

export interface ActivePlaybackSessionForQueueReplay {
  release: DiscogsRelease | null;
  activeTrackPosition: string | null;
  isReleasePreview: boolean;
  activeVideoId: string | null;
}

export const isQueueItemReplayOfActiveSession = (
  item: PlaybackQueueItem,
  session: ActivePlaybackSessionForQueueReplay,
): boolean => {
  if (!session.release) {
    return false;
  }

  if (!isSameReleaseInstance(session.release, item.release)) {
    return false;
  }

  if (item.previewVideoUri) {
    return (
      session.isReleasePreview &&
      session.activeVideoId !== null &&
      parseYoutubeVideoId(item.previewVideoUri) === session.activeVideoId
    );
  }

  if (session.isReleasePreview) {
    return false;
  }

  return (
    session.activeTrackPosition !== null &&
    item.trackPosition === session.activeTrackPosition
  );
};
