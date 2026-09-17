import type { DiscogsVideo } from "src/types";

export const isPlaybackReleaseDetailSynced = (
  releaseId: number | null,
  releaseDetailId: number | undefined,
): boolean =>
  releaseId !== null && Number(releaseDetailId) === Number(releaseId);

export const findPendingPreviewVideo = (
  videos: DiscogsVideo[],
  pendingPreviewVideoUri: string | null,
): DiscogsVideo | undefined => {
  if (!pendingPreviewVideoUri) {
    return undefined;
  }

  return videos.find((entry) => entry.uri === pendingPreviewVideoUri);
};

export const shouldClearTransportForMissingVideo = ({
  tracksLength,
  activeVideoId,
  embedVideoId,
  isReleasePreview,
  isReleaseDetailSynced,
}: {
  tracksLength: number;
  activeVideoId: string | null;
  embedVideoId: string | null;
  isReleasePreview: boolean;
  isReleaseDetailSynced: boolean;
}): boolean =>
  isReleaseDetailSynced &&
  tracksLength > 0 &&
  activeVideoId === null &&
  embedVideoId === null &&
  !isReleasePreview;

export const shouldResetActiveTrackIndex = ({
  tracksLength,
  activeTrackIndex,
  pendingTrackPosition,
}: {
  tracksLength: number;
  activeTrackIndex: number;
  pendingTrackPosition: string | null;
}): boolean =>
  tracksLength > 0 &&
  pendingTrackPosition === null &&
  activeTrackIndex >= tracksLength;
