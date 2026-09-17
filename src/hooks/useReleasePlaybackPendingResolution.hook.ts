"use client";

import { type Dispatch, type RefObject, useEffect } from "react";
import type { SimilarQueueMode } from "src/hooks/useReleasePlaybackSimilarQueue.hook";
import type { DiscogsRelease, DiscogsTrack, DiscogsVideo } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import {
  buildPlayableAlbumQueue,
  upcomingFromAlbumQueue,
} from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import { findTrackIndexByPosition } from "src/utils/releasePlayback";
import {
  findPendingPreviewVideo,
  isPlaybackReleaseDetailSynced,
  shouldClearTransportForMissingVideo,
  shouldResetActiveTrackIndex,
} from "src/utils/releasePlaybackPendingResolution";
import { clearPersistedReleasePlayback } from "src/utils/releasePlaybackStorage";

interface AppendSimilarReleasesParams {
  sourceRelease: DiscogsRelease;
  generation: number;
  existingQueue: PlaybackQueueItem[];
}

interface UseReleasePlaybackPendingResolutionParams {
  abortUnresolvedPlayback: () => void;
  activeTrackIndex: number;
  activeVideoId: string | null;
  embedVideoId: string | null;
  appendSimilarReleasesToQueue: (
    params: AppendSimilarReleasesParams,
  ) => Promise<boolean>;
  awaitingResumeGestureRef: RefObject<boolean>;
  dispatchSession: Dispatch<PlaybackSessionAction>;
  isLoading: boolean;
  isPlaying: boolean;
  isReleasePreview: boolean;
  maybeExtendQueueTail: () => void;
  pendingPreviewVideoUri: string | null;
  pendingTrackPosition: string | null;
  previewVideo: DiscogsVideo | null;
  release: DiscogsRelease | null;
  releaseDetailId: number | undefined;
  releaseId: number | null;
  setUpcomingQueue: (nextQueue: PlaybackQueueItem[]) => void;
  shouldRebuildAlbumQueueRef: RefObject<boolean>;
  similarQueueGenerationRef: RefObject<number>;
  similarQueueModeRef: RefObject<SimilarQueueMode>;
  tracks: DiscogsTrack[];
  videos: DiscogsVideo[];
}

export const useReleasePlaybackPendingResolution = ({
  abortUnresolvedPlayback,
  activeTrackIndex,
  activeVideoId,
  embedVideoId,
  appendSimilarReleasesToQueue,
  awaitingResumeGestureRef,
  dispatchSession,
  isLoading,
  isPlaying,
  isReleasePreview,
  maybeExtendQueueTail,
  pendingPreviewVideoUri,
  pendingTrackPosition,
  previewVideo,
  release,
  releaseDetailId,
  releaseId,
  setUpcomingQueue,
  shouldRebuildAlbumQueueRef,
  similarQueueGenerationRef,
  similarQueueModeRef,
  tracks,
  videos,
}: UseReleasePlaybackPendingResolutionParams): void => {
  useEffect(() => {
    if (!isPlaying || previewVideo !== null) {
      return;
    }

    maybeExtendQueueTail();
  }, [isPlaying, maybeExtendQueueTail, previewVideo]);

  useEffect(() => {
    if (
      !pendingTrackPosition ||
      tracks.length === 0 ||
      !isPlaybackReleaseDetailSynced(releaseId, releaseDetailId)
    ) {
      return;
    }

    const index = findTrackIndexByPosition(tracks, pendingTrackPosition);

    if (index < 0) {
      abortUnresolvedPlayback();
      return;
    }

    dispatchSession({
      type: "RESOLVE_PENDING_TRACK",
      index,
      resumeTransport: !awaitingResumeGestureRef.current,
    });

    awaitingResumeGestureRef.current = false;

    if (shouldRebuildAlbumQueueRef.current && release) {
      const albumQueue = buildPlayableAlbumQueue({
        release,
        tracks,
        videos,
        startPosition: pendingTrackPosition,
      });
      const upcoming = upcomingFromAlbumQueue(albumQueue);

      setUpcomingQueue(upcoming);
      shouldRebuildAlbumQueueRef.current = false;

      if (similarQueueModeRef.current.initialAppendPending) {
        similarQueueModeRef.current.initialAppendPending = false;
        void appendSimilarReleasesToQueue({
          sourceRelease: release,
          generation: similarQueueGenerationRef.current,
          existingQueue: upcoming,
        });
      }
    }
  }, [
    abortUnresolvedPlayback,
    appendSimilarReleasesToQueue,
    awaitingResumeGestureRef,
    dispatchSession,
    pendingTrackPosition,
    release,
    releaseDetailId,
    releaseId,
    setUpcomingQueue,
    shouldRebuildAlbumQueueRef,
    similarQueueGenerationRef,
    similarQueueModeRef,
    tracks,
    videos,
  ]);

  useEffect(() => {
    if (
      !pendingPreviewVideoUri ||
      videos.length === 0 ||
      !isPlaybackReleaseDetailSynced(releaseId, releaseDetailId)
    ) {
      return;
    }

    const video = findPendingPreviewVideo(videos, pendingPreviewVideoUri);

    if (!video) {
      abortUnresolvedPlayback();
      return;
    }

    dispatchSession({ type: "RESOLVE_PREVIEW_VIDEO", video });
  }, [
    abortUnresolvedPlayback,
    dispatchSession,
    pendingPreviewVideoUri,
    releaseDetailId,
    releaseId,
    videos,
  ]);

  useEffect(() => {
    if (
      !isPlaying ||
      isLoading ||
      pendingTrackPosition ||
      pendingPreviewVideoUri
    ) {
      return;
    }

    const isReleaseDetailSynced = isPlaybackReleaseDetailSynced(
      releaseId,
      releaseDetailId,
    );

    if (
      !shouldClearTransportForMissingVideo({
        tracksLength: tracks.length,
        activeVideoId,
        embedVideoId,
        isReleasePreview,
        isReleaseDetailSynced,
      })
    ) {
      return;
    }

    dispatchSession({ type: "SET_TRANSPORT_OFF" });
    clearPersistedReleasePlayback();
  }, [
    activeVideoId,
    dispatchSession,
    embedVideoId,
    isLoading,
    isPlaying,
    isReleasePreview,
    pendingPreviewVideoUri,
    pendingTrackPosition,
    releaseDetailId,
    releaseId,
    tracks.length,
  ]);

  useEffect(() => {
    if (
      !shouldResetActiveTrackIndex({
        tracksLength: tracks.length,
        activeTrackIndex,
        pendingTrackPosition,
      })
    ) {
      return;
    }

    dispatchSession({ type: "SET_ACTIVE_TRACK_INDEX", index: 0 });
    dispatchSession({ type: "RESUME" });
  }, [activeTrackIndex, dispatchSession, pendingTrackPosition, tracks.length]);
};
