import type { DiscogsTrack } from "src/types/discogs-release-detail.types";
import {
  parseYoutubeVideoId,
  type ReleasePlaybackMatchIndex,
  resolvePlayableTrackAtPosition,
} from "src/utils/releasePlayback";

export const resolveTrackPlaybackYoutubeVideoId = ({
  trackPosition,
  tracks,
  playbackMatchIndex,
  userYoutubeIdByPosition,
}: {
  trackPosition: string;
  tracks: DiscogsTrack[];
  playbackMatchIndex: ReleasePlaybackMatchIndex;
  userYoutubeIdByPosition: Readonly<Record<string, string>>;
}): string | null => {
  const override = userYoutubeIdByPosition[trackPosition]?.trim();

  if (override) {
    return override;
  }

  const resolved = resolvePlayableTrackAtPosition({
    trackPosition,
    tracks,
    playbackMatchIndex,
  });

  if (!resolved) {
    return null;
  }

  return parseYoutubeVideoId(resolved.matchedVideo.uri);
};

export const isTrackPositionPlayableWithOverrides = ({
  trackPosition,
  playbackMatchIndex,
  userYoutubeIdByPosition,
}: {
  trackPosition: string;
  playbackMatchIndex: ReleasePlaybackMatchIndex;
  userYoutubeIdByPosition: Readonly<Record<string, string>>;
}): boolean =>
  Boolean(userYoutubeIdByPosition[trackPosition]) ||
  playbackMatchIndex.trackVideoByPosition.has(trackPosition);
