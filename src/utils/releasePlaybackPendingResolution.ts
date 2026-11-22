import type { DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { parseReleaseId } from "src/utils/releaseNotes";
import { findTrackIndexByPosition } from "src/utils/releasePlayback";
import { readReleaseEmbeddedTracklist } from "src/utils/resolveQueueItemEmbedTracksVideos";

export const findQueueItemTrackResolutionIndex = ({
  item,
  isSameRelease,
  releaseDetailId,
  sessionTracks,
}: {
  item: PlaybackQueueItem;
  isSameRelease: boolean;
  releaseDetailId: number | undefined;
  sessionTracks: DiscogsTrack[];
}): number => {
  const itemReleaseId = parseReleaseId(item.release);

  if (itemReleaseId === null) {
    return -1;
  }

  const embeddedTracks = readReleaseEmbeddedTracklist(item.release);
  const embeddedIndex =
    embeddedTracks.length > 0
      ? findTrackIndexByPosition(embeddedTracks, item.trackPosition)
      : -1;
  const isTargetReleaseDetailSynced = isPlaybackReleaseDetailSynced(
    itemReleaseId,
    releaseDetailId,
  );

  if (item.fromCollectionRadio && embeddedIndex >= 0) {
    return embeddedIndex;
  }

  if (embeddedIndex >= 0 && !(isTargetReleaseDetailSynced && isSameRelease)) {
    return embeddedIndex;
  }

  if (Number(releaseDetailId) === itemReleaseId && sessionTracks.length > 0) {
    return findTrackIndexByPosition(sessionTracks, item.trackPosition);
  }

  if (embeddedIndex >= 0) {
    return embeddedIndex;
  }

  return -1;
};

export const resolveCanResolveTrackIndexFromLoadedDetail = ({
  item,
  isSameRelease,
  releaseDetailId,
  resolvedYoutubeVideoId,
  resolutionIndex,
}: {
  item: PlaybackQueueItem;
  isSameRelease: boolean;
  releaseDetailId: number | undefined;
  resolvedYoutubeVideoId: string | null;
  resolutionIndex: number;
}): boolean => {
  const itemReleaseId = parseReleaseId(item.release);
  const isTargetReleaseDetailSynced = isPlaybackReleaseDetailSynced(
    itemReleaseId,
    releaseDetailId,
  );
  const embeddedTracks = readReleaseEmbeddedTracklist(item.release);
  const embeddedIndex =
    embeddedTracks.length > 0
      ? findTrackIndexByPosition(embeddedTracks, item.trackPosition)
      : -1;
  const resolvesFromEmbeddedTracklist =
    embeddedIndex >= 0 && resolutionIndex === embeddedIndex;

  return (
    !resolvedYoutubeVideoId ||
    isTargetReleaseDetailSynced ||
    !isSameRelease ||
    (item.fromCollectionRadio === true && resolutionIndex >= 0) ||
    resolvesFromEmbeddedTracklist
  );
};

export const resolvePlayQueueItemPendingTrackPlay = ({
  item,
  isSameRelease,
  releaseDetailId,
  sessionTracks,
  resolvedYoutubeVideoId,
}: {
  item: PlaybackQueueItem;
  isSameRelease: boolean;
  releaseDetailId: number | undefined;
  sessionTracks: DiscogsTrack[];
  resolvedYoutubeVideoId: string | null;
}): {
  canResolveTrackIndexFromLoadedDetail: boolean;
  pendingTrackPosition: string | null;
  resolutionIndex: number;
} => {
  const resolutionIndex = item.previewVideoUri
    ? -1
    : findQueueItemTrackResolutionIndex({
        item,
        isSameRelease,
        releaseDetailId,
        sessionTracks,
      });
  const canResolveTrackIndexFromLoadedDetail =
    resolveCanResolveTrackIndexFromLoadedDetail({
      item,
      isSameRelease,
      releaseDetailId,
      resolvedYoutubeVideoId,
      resolutionIndex,
    });
  const pendingTrackPosition =
    item.previewVideoUri ||
    (resolutionIndex >= 0 && canResolveTrackIndexFromLoadedDetail)
      ? null
      : item.trackPosition;

  return {
    canResolveTrackIndexFromLoadedDetail,
    pendingTrackPosition,
    resolutionIndex,
  };
};

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
  activeTrackHasYoutubeOverride = false,
}: {
  tracksLength: number;
  activeVideoId: string | null;
  embedVideoId: string | null;
  isReleasePreview: boolean;
  isReleaseDetailSynced: boolean;
  activeTrackHasYoutubeOverride?: boolean;
}): boolean =>
  isReleaseDetailSynced &&
  tracksLength > 0 &&
  activeVideoId === null &&
  embedVideoId === null &&
  !isReleasePreview &&
  !activeTrackHasYoutubeOverride;

export const shouldApplyPendingAlbumQueueRebuild = ({
  shouldRebuildAlbumQueue,
  queueManuallyExtended,
}: {
  shouldRebuildAlbumQueue: boolean;
  queueManuallyExtended: boolean;
}): boolean => shouldRebuildAlbumQueue && !queueManuallyExtended;

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

export const resolveIsQueueBuilding = ({
  isSimilarQueueLoading,
  pendingTrackPosition,
  releaseId,
  isReleaseDetailLoading,
  tracksLength,
}: {
  isSimilarQueueLoading: boolean;
  pendingTrackPosition: string | null;
  releaseId: number | null;
  isReleaseDetailLoading: boolean;
  tracksLength: number;
}): boolean =>
  isSimilarQueueLoading ||
  (pendingTrackPosition !== null &&
    releaseId !== null &&
    (isReleaseDetailLoading || tracksLength === 0));
