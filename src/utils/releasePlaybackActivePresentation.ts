import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import {
  findVideoForTrack,
  parseYoutubeVideoId,
  type ReleasePlaybackMatchIndex,
} from "src/utils/releasePlayback";

export const resolveActivePlaybackVideo = ({
  previewVideo,
  activeTrack,
  videos,
  playbackMatchIndex,
}: {
  previewVideo: DiscogsVideo | null;
  activeTrack: DiscogsTrack | null;
  videos: DiscogsVideo[];
  playbackMatchIndex: ReleasePlaybackMatchIndex;
}): DiscogsVideo | null => {
  if (previewVideo) {
    return previewVideo;
  }

  if (!activeTrack) {
    return null;
  }

  return findVideoForTrack({
    track: activeTrack,
    videos,
    matchIndex: playbackMatchIndex,
  });
};

export const resolveActiveVideoId = (
  activeVideo: DiscogsVideo | null,
): string | null => (activeVideo ? parseYoutubeVideoId(activeVideo.uri) : null);

export const resolveIsPlaybackReady = ({
  isPlaying,
  playbackVideoId,
}: {
  isPlaying: boolean;
  playbackVideoId: string | null;
}): boolean => isPlaying && playbackVideoId !== null;

export const resolvePlaybackVideoId = ({
  pendingTrackPosition,
  pendingPreviewVideoUri,
  embedVideoId,
  activeVideoId,
}: {
  pendingTrackPosition: string | null;
  pendingPreviewVideoUri: string | null;
  embedVideoId: string | null;
  activeVideoId: string | null;
}): string | null => {
  if (pendingTrackPosition || pendingPreviewVideoUri) {
    return embedVideoId ?? activeVideoId;
  }

  return activeVideoId ?? embedVideoId;
};

export const resolveActivePlaybackTitle = ({
  isReleasePreview,
  previewTitle,
  trackTitle,
}: {
  isReleasePreview: boolean;
  previewTitle: string | null;
  trackTitle: string | null;
}): string | null => (isReleasePreview ? previewTitle : trackTitle);

export const resolveActiveTrackPosition = ({
  isReleasePreview,
  trackPosition,
}: {
  isReleasePreview: boolean;
  trackPosition: string | null;
}): string | null => (isReleasePreview ? null : trackPosition);
