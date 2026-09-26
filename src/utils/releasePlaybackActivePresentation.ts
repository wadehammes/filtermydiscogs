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
  transitionTargetVideoId = null,
  pendingTrackPosition,
  pendingPreviewVideoUri,
  embedVideoId,
  activeVideoId,
}: {
  transitionTargetVideoId?: string | null;
  pendingTrackPosition: string | null;
  pendingPreviewVideoUri: string | null;
  embedVideoId: string | null;
  activeVideoId: string | null;
}): string | null => {
  if (transitionTargetVideoId) {
    return transitionTargetVideoId;
  }

  if (pendingTrackPosition || pendingPreviewVideoUri) {
    return embedVideoId ?? activeVideoId;
  }

  return activeVideoId ?? embedVideoId;
};

export const PLAYBACK_VIDEO_UI_LOADING_TIMEOUT_MS = 8000;

export const resolveNeedsPlaybackVideoSwitch = ({
  preparedEmbedVideoId,
  activeVideoId,
  replaySameTrack = false,
  forceEmbedReload = false,
}: {
  preparedEmbedVideoId: string | null;
  activeVideoId: string | null;
  replaySameTrack?: boolean;
  forceEmbedReload?: boolean;
}): boolean => {
  if (
    !forceEmbedReload &&
    replaySameTrack &&
    preparedEmbedVideoId !== null &&
    preparedEmbedVideoId === activeVideoId
  ) {
    return false;
  }

  if (replaySameTrack && preparedEmbedVideoId !== null) {
    return true;
  }

  return (
    preparedEmbedVideoId !== null && preparedEmbedVideoId !== activeVideoId
  );
};

export const shouldBeginPlaybackVideoUiLoading = ({
  hasQueueItem,
  preparedEmbedVideoId,
  activeVideoId,
  replaySameTrack = false,
  forceEmbedReload = false,
}: {
  hasQueueItem: boolean;
  preparedEmbedVideoId: string | null;
  activeVideoId: string | null;
  replaySameTrack?: boolean;
  forceEmbedReload?: boolean;
}): boolean => {
  if (!hasQueueItem) {
    return true;
  }

  if (preparedEmbedVideoId === null) {
    return true;
  }

  return resolveNeedsPlaybackVideoSwitch({
    preparedEmbedVideoId,
    activeVideoId,
    replaySameTrack,
    forceEmbedReload,
  });
};

export const doesPlaybackVideoUiLoadingTargetMatch = ({
  loadingTargetVideoId,
  activeVideoId,
  embedVideoId,
  transitionTargetVideoId,
}: {
  loadingTargetVideoId: string | null;
  activeVideoId: string | null;
  embedVideoId: string | null;
  transitionTargetVideoId: string | null;
}): boolean => {
  if (loadingTargetVideoId === null) {
    return true;
  }

  return (
    activeVideoId === loadingTargetVideoId ||
    embedVideoId === loadingTargetVideoId ||
    transitionTargetVideoId === loadingTargetVideoId
  );
};

export const shouldClearPlaybackVideoTransition = ({
  transitionTargetVideoId,
  activeVideoId,
  pendingTrackPosition,
  pendingPreviewVideoUri,
}: {
  transitionTargetVideoId: string | null;
  activeVideoId: string | null;
  pendingTrackPosition: string | null;
  pendingPreviewVideoUri: string | null;
}): boolean =>
  transitionTargetVideoId !== null &&
  pendingTrackPosition === null &&
  pendingPreviewVideoUri === null &&
  activeVideoId === transitionTargetVideoId;

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
