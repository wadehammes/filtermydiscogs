import { beforeEach, describe, expect, it } from "@jest/globals";

jest.mock("src/analytics/productAnalyticsEvents", () => ({
  trackPlaybackQueued: jest.fn(),
  trackPlaybackStarted: jest.fn(),
}));

const mockSetCollectionRadioActive = jest.fn();

jest.mock("jotai", () => {
  const actual = jest.requireActual<typeof import("jotai")>("jotai");
  return {
    ...actual,
    useSetAtom: () => mockSetCollectionRadioActive,
  };
});

import type { Dispatch } from "react";
import { useReleasePlaybackQueueActions } from "src/hooks/useReleasePlaybackQueueActions.hook";

import { createSimilarQueueMode } from "src/hooks/useReleasePlaybackSimilarQueue.hook";
import type { UserTrackRecordBody } from "src/lib/validation/userTrack.schemas";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { createQueueItem } from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import {
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import {
  bindRecordTrackEvent,
  resetRecordTrackEventBinding,
  resetUserTrackRecordingSession,
} from "src/utils/userTrackRecording";
import { renderHook } from "test-utils";

type SyncEmbedForQueueItemMock = (
  item: PlaybackQueueItem,
  options?: { forceReload?: boolean },
) => string | null;

const mockSyncEmbedForQueueItem = (
  implementation?: SyncEmbedForQueueItemMock,
): SyncEmbedForQueueItemMock =>
  (implementation
    ? jest.fn(implementation)
    : jest.fn()) as unknown as SyncEmbedForQueueItemMock;

const buildHarness = ({
  sessionQueue = [] as ReturnType<typeof createQueueItem>[],
  tryAutoStartOnEmptyQueue = () => false,
}: {
  sessionQueue?: ReturnType<typeof createQueueItem>[];
  tryAutoStartOnEmptyQueue?: (start: () => void) => boolean;
} = {}) => {
  const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
  const release = releaseFactory.withDisplayDefaults();
  const queueRef = { current: sessionQueue };
  const releaseRef = { current: release };
  const playbackHistoryRef = {
    current: [] as ReturnType<typeof createQueueItem>[],
  };
  const similarQueueModeRef = {
    current: createSimilarQueueMode(true),
  };
  const extendQueueWithSimilarReleasesRef = { current: true };
  const similarQueueGenerationRef = { current: 0 };
  const similarQueueTailToastShownRef = { current: false };
  const queueManuallyExtendedRef = { current: true };
  const similarQueueSuppressedAfterClearRef = { current: false };
  const shouldRebuildAlbumQueueRef = { current: false };
  const awaitingResumeGestureRef = { current: false };
  const pendingPlayFromGestureRef = { current: false };
  const isPlayingRef = { current: false };
  const releaseDetailIdRef = { current: release.basic_information.id };
  const tracksRef = {
    current: [
      discogsTrackFactory.build({
        position: "A1",
        title: "Track A1",
        type_: "track",
      }),
    ],
  };
  const lastSyncedActiveVideoIdRef = { current: null as string | null };
  const matchedActiveVideoIdRef = { current: "te2jJncBVG4" as string | null };
  const activeVideoIdRef = { current: "te2jJncBVG4" as string | null };
  const embedVideoIdRef = { current: null as string | null };
  const activeTrackPositionRef = { current: "A1" as string | null };
  const isReleasePreviewRef = { current: false };
  const resetDockEmbedProgress = jest.fn();
  const isPausedRef = { current: false };
  const setPlaybackVideoUiLoadingTargetId = jest.fn();
  const playNextRef = { current: () => {} };
  const extendQueueTailRef = {
    current: async () => false,
  };
  const startPlaybackRef = { current: () => {} };

  const clearPlaybackVideoUiLoading = jest.fn();
  const resetEmbedSession = jest.fn();
  const beginPlaybackVideoUiLoading = jest.fn();
  const markEmbedTrackSwitchGrace = jest.fn();
  const prepareQueueAdvancePlayback = jest.fn();
  const settleSameUploadQueueAdvance = jest.fn();
  const setUpcomingQueue = jest.fn((nextQueue: typeof sessionQueue) => {
    queueRef.current = nextQueue;
  });
  const updateUpcomingQueue = jest.fn(
    (updater: (previous: typeof sessionQueue) => typeof sessionQueue) => {
      queueRef.current = updater(queueRef.current);
    },
  );

  const { result } = renderHook(() =>
    useReleasePlaybackQueueActions({
      resetDockEmbedProgress,
      dispatchSession,
      setNowPlayingQueueItem: jest.fn(),
      setPlaybackTrackTitleOverride: jest.fn(),
      setShouldAutoplayEmbed: jest.fn(),
      setIsPlaybackEmbedMounted: jest.fn(),
      setPlaybackVideoTransitionTargetId: jest.fn(),
      setPlaybackVideoUiLoadingTargetId,
      clearPlaybackVideoUiLoading,
      resetEmbedSession,
      beginPlaybackVideoUiLoading,
      markEmbedTrackSwitchGrace,
      prepareQueueAdvancePlayback,
      settleSameUploadQueueAdvance,
      setEmbedVideoId: jest.fn(),
      clearPlayFromGestureRetries: jest.fn(),
      syncEmbedToVideoId: jest.fn(),
      syncEmbedForQueueItem: jest.fn(() => null),
      prefetchQueueItemEmbed: jest.fn(),
      setUpcomingQueue,
      updateUpcomingQueue,
      maybePushCurrentToHistory: jest.fn(),
      prependCurrentToUpcoming: jest.fn(),
      tryAutoStartOnEmptyQueue,
      extendQueueTail: async () => false,
      playNextRef,
      extendQueueTailRef,
      startPlaybackRef,
      refs: {
        awaitingResumeGestureRef,
        pendingPlayFromGestureRef,
        shouldRebuildAlbumQueueRef,
        similarQueueModeRef,
        similarQueueGenerationRef,
        extendQueueWithSimilarReleasesRef,
        similarQueueTailToastShownRef,
        queueManuallyExtendedRef,
        similarQueueSuppressedAfterClearRef,
        releaseRef,
        queueRef,
        playbackHistoryRef,
        isPlayingRef,
        isPausedRef,
        releaseDetailIdRef,
        tracksRef,
        lastSyncedActiveVideoIdRef,
        matchedActiveVideoIdRef,
        activeVideoIdRef,
        embedVideoIdRef,
        activeTrackPositionRef,
        isReleasePreviewRef,
      },
    }),
  );

  return {
    dispatchSession,
    queueManuallyExtendedRef,
    queueRef,
    resetDockEmbedProgress,
    result,
    shouldRebuildAlbumQueueRef,
    similarQueueModeRef,
    similarQueueSuppressedAfterClearRef,
    clearPlaybackVideoUiLoading,
    resetEmbedSession,
    prepareQueueAdvancePlayback,
    setUpcomingQueue,
    updateUpcomingQueue,
  };
};

describe("useReleasePlaybackQueueActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetCollectionRadioActive.mockClear();
    localStorage.clear();
  });

  it("does not record a play when startPlayback begins paused after session restore", () => {
    const recordedPlays: UserTrackRecordBody[] = [];

    resetUserTrackRecordingSession();
    bindRecordTrackEvent((body) => {
      if (body.event === "play") {
        recordedPlays.push(body);
      }
    });

    const release = releaseFactory.withDisplayDefaults();
    const { result } = buildHarness();

    result.current.startPlayback({
      release,
      trackPosition: "A1",
      startPaused: true,
      rebuildAlbumQueue: false,
    });

    expect(recordedPlays).toHaveLength(0);
    resetRecordTrackEventBinding();
  });

  it("does not reset dock embed progress when playQueueItem starts paused", () => {
    const release = releaseFactory.withDisplayDefaults();
    const { result, resetDockEmbedProgress } = buildHarness();

    result.current.startPlayback({
      release,
      trackPosition: "A1",
      startPaused: true,
    });

    expect(resetDockEmbedProgress).not.toHaveBeenCalled();
  });

  it("records a play when startPlayback begins unpaused transport", () => {
    const recordedPlays: UserTrackRecordBody[] = [];

    resetUserTrackRecordingSession();
    bindRecordTrackEvent((body) => {
      if (body.event === "play") {
        recordedPlays.push(body);
      }
    });

    const release = releaseFactory.withDisplayDefaults();
    const { result } = buildHarness();

    result.current.startPlayback({
      release,
      trackPosition: "A1",
      rebuildAlbumQueue: false,
    });

    expect(recordedPlays).toHaveLength(1);
    resetRecordTrackEventBinding();
  });

  it("playNext sets transition and gesture retries when the embed id was prefetched ahead of the active upload", () => {
    const release = releaseFactory.withDisplayDefaults();
    const nextItem = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Next",
    });
    const setPlaybackVideoTransitionTargetId = jest.fn();
    const pendingPlayFromGestureRef = { current: false };
    const embedVideoIdRef = { current: "abc12345678" as string | null };
    const activeVideoIdRef = { current: "te2jJncBVG4" as string | null };
    const queueRef = { current: [nextItem] };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId,
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => "abc12345678"),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(
          (
            updater: (
              previous: ReturnType<typeof createQueueItem>[],
            ) => ReturnType<typeof createQueueItem>[],
          ) => {
            queueRef.current = updater(queueRef.current);
          },
        ),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef,
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: "te2jJncBVG4" },
          matchedActiveVideoIdRef: { current: "te2jJncBVG4" },
          activeVideoIdRef,
          embedVideoIdRef,
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playNext();

    expect(setPlaybackVideoTransitionTargetId).toHaveBeenCalledWith(
      "abc12345678",
    );
    expect(pendingPlayFromGestureRef.current).toBe(true);
  });

  it("playNext confirms embed playback when the next row reuses the same YouTube upload", () => {
    const release = releaseFactory.withDisplayDefaults();
    const nextItem = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Same upload",
    });
    const sharedVideoId = "abc12345678";
    const settleSameUploadQueueAdvance = jest.fn();
    const prepareQueueAdvancePlayback = jest.fn();
    const queueRef = { current: [nextItem] };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback,
        settleSameUploadQueueAdvance,
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => sharedVideoId),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(
          (updater: (previous: (typeof nextItem)[]) => (typeof nextItem)[]) => {
            queueRef.current = updater(queueRef.current);
          },
        ),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: sharedVideoId },
          matchedActiveVideoIdRef: { current: sharedVideoId },
          activeVideoIdRef: { current: sharedVideoId },
          embedVideoIdRef: { current: sharedVideoId },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playNext();

    expect(prepareQueueAdvancePlayback).toHaveBeenCalledWith(nextItem, {
      forceEmbedReloadAfterUnavailableSkip: false,
    });
    expect(settleSameUploadQueueAdvance).toHaveBeenCalledTimes(1);
  });

  it("when embedVideoId is prefetched ahead of matchedActiveVideoId, playNext begins video UI loading for the track switch", () => {
    const release = releaseFactory.withDisplayDefaults();
    const priorMatchedVideoId = "te2jJncBVG4";
    const nextUploadId = "abc12345678";
    const nextItem = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Next track",
    });
    const beginPlaybackVideoUiLoading = jest.fn();
    const markEmbedTrackSwitchGrace = jest.fn();
    const settleSameUploadQueueAdvance = jest.fn();
    const setPlaybackVideoUiLoadingTargetId = jest.fn();
    const setPlaybackVideoTransitionTargetId = jest.fn();
    const queueRef = { current: [nextItem] };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId,
        setPlaybackVideoUiLoadingTargetId,
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading,
        markEmbedTrackSwitchGrace,
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance,
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => nextUploadId),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(
          (updater: (previous: (typeof nextItem)[]) => (typeof nextItem)[]) => {
            queueRef.current = updater(queueRef.current);
          },
        ),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: priorMatchedVideoId },
          matchedActiveVideoIdRef: { current: priorMatchedVideoId },
          activeVideoIdRef: { current: nextUploadId },
          embedVideoIdRef: { current: nextUploadId },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playNext();

    expect(beginPlaybackVideoUiLoading).toHaveBeenCalledTimes(1);
    expect(markEmbedTrackSwitchGrace).toHaveBeenCalledTimes(1);
    expect(setPlaybackVideoUiLoadingTargetId).toHaveBeenCalledWith(
      nextUploadId,
    );
    expect(setPlaybackVideoTransitionTargetId).toHaveBeenCalledWith(
      nextUploadId,
    );
    expect(settleSameUploadQueueAdvance).not.toHaveBeenCalled();
  });

  it("playNext reloads embed playback when the next row repeats the active track", () => {
    const release = releaseFactory.withDisplayDefaults();
    const nextItem = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Replay",
    });
    const sharedVideoId = "abc12345678";
    const settleSameUploadQueueAdvance = jest.fn();
    const setPlaybackVideoTransitionTargetId = jest.fn();
    const setPlaybackVideoUiLoadingTargetId = jest.fn();
    const prepareQueueAdvancePlayback = jest.fn();
    const queueRef = { current: [nextItem] };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId,
        setPlaybackVideoUiLoadingTargetId,
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback,
        settleSameUploadQueueAdvance,
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => sharedVideoId),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(
          (updater: (previous: (typeof nextItem)[]) => (typeof nextItem)[]) => {
            queueRef.current = updater(queueRef.current);
          },
        ),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: sharedVideoId },
          matchedActiveVideoIdRef: { current: sharedVideoId },
          activeVideoIdRef: { current: sharedVideoId },
          embedVideoIdRef: { current: sharedVideoId },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playNext();

    expect(settleSameUploadQueueAdvance).not.toHaveBeenCalled();
    expect(setPlaybackVideoUiLoadingTargetId).toHaveBeenCalledWith(
      sharedVideoId,
    );
    expect(setPlaybackVideoTransitionTargetId).toHaveBeenCalledWith(
      sharedVideoId,
    );
  });

  it("startPlayback with an explicit youtubeVideoId settles same-upload replay without force reload", () => {
    const release = releaseFactory.withDisplayDefaults();
    const sharedVideoId = "abc12345678";
    const syncEmbedForQueueItem = mockSyncEmbedForQueueItem();
    const settleSameUploadQueueAdvance = jest.fn();
    const beginPlaybackVideoUiLoading = jest.fn();
    const syncEmbedToVideoId = jest.fn() as jest.Mock<
      (videoId: string) => void
    >;
    const resetDockEmbedProgress = jest.fn();

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress,
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading,
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance,
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId,
        syncEmbedForQueueItem,
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: sharedVideoId },
          matchedActiveVideoIdRef: { current: sharedVideoId },
          activeVideoIdRef: { current: sharedVideoId },
          embedVideoIdRef: { current: sharedVideoId },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release,
      trackPosition: "A1",
      trackTitle: "Replay",
      youtubeVideoId: sharedVideoId,
    });

    expect(resetDockEmbedProgress).not.toHaveBeenCalled();
    expect(syncEmbedForQueueItem).not.toHaveBeenCalled();
    expect(syncEmbedToVideoId).toHaveBeenCalledWith(sharedVideoId);
    expect(settleSameUploadQueueAdvance).toHaveBeenCalledTimes(1);
    expect(beginPlaybackVideoUiLoading).not.toHaveBeenCalled();
  });

  it("resets dock embed progress when playQueueItem forces an upload switch", () => {
    const release = releaseFactory.withDisplayDefaults();
    const nextVideoId = "def98765432";
    const resetDockEmbedProgress = jest.fn();

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress,
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => nextVideoId),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: "abc12345678" },
          matchedActiveVideoIdRef: { current: "abc12345678" },
          activeVideoIdRef: { current: "abc12345678" },
          embedVideoIdRef: { current: "abc12345678" },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release,
      trackPosition: "B1",
      trackTitle: "Track B1",
      youtubeVideoId: nextVideoId,
    });

    expect(resetDockEmbedProgress).not.toHaveBeenCalled();
  });

  it("does not reset dock embed progress in playQueueItem on first play (reset runs on imperative embed load)", () => {
    const release = releaseFactory.withDisplayDefaults();
    const videoId = "abc12345678";
    const resetDockEmbedProgress = jest.fn();
    const syncEmbedToVideoId = jest.fn() as jest.Mock<
      (videoId: string) => void
    >;
    const settleSameUploadQueueAdvance = jest.fn();

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress,
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance,
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId,
        syncEmbedForQueueItem: jest.fn(),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: null },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: false },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: null },
          activeVideoIdRef: { current: null },
          embedVideoIdRef: { current: null },
          activeTrackPositionRef: { current: null },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release,
      trackPosition: "A1",
      trackTitle: "Track A1",
      youtubeVideoId: videoId,
    });

    expect(resetDockEmbedProgress).not.toHaveBeenCalled();
    expect(syncEmbedToVideoId).toHaveBeenCalledWith(videoId);
    expect(settleSameUploadQueueAdvance).not.toHaveBeenCalled();
  });

  it("does not reset dock embed progress on same-upload playNext when matchedActiveVideoId is still null", () => {
    const release = releaseFactory.withDisplayDefaults();
    const sharedVideoId = "abc12345678";
    const nextItem = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Track B1",
    });
    const resetDockEmbedProgress = jest.fn();
    const settleSameUploadQueueAdvance = jest.fn();
    const syncEmbedForQueueItem = mockSyncEmbedForQueueItem(
      () => sharedVideoId,
    );
    const queueRef = { current: [nextItem] };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress,
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance,
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem,
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: sharedVideoId },
          matchedActiveVideoIdRef: { current: null },
          activeVideoIdRef: { current: null },
          embedVideoIdRef: { current: sharedVideoId },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playNext();

    expect(resetDockEmbedProgress).not.toHaveBeenCalled();
    expect(settleSameUploadQueueAdvance).toHaveBeenCalledTimes(1);
  });

  it("when release detail is not loaded, playQueueItem with an explicit youtubeVideoId still pending the target track position", () => {
    const release = releaseFactory.withDisplayDefaults();
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const syncEmbedToVideoId = jest.fn() as jest.Mock<
      (videoId: string) => void
    >;
    const sharedVideoId = "abc12345678";

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId,
        syncEmbedForQueueItem: jest.fn(() => null),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: false },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: false },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: undefined },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: null },
          activeVideoIdRef: { current: null },
          embedVideoIdRef: { current: null },
          activeTrackPositionRef: { current: null },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release,
      trackPosition: "A2",
      trackTitle: "Override track",
      rebuildAlbumQueue: false,
      youtubeVideoId: sharedVideoId,
    });

    expect(dispatchSession).toHaveBeenCalledWith({
      type: "PLAY_QUEUE_ITEM",
      params: expect.objectContaining({
        pendingTrackPosition: "A2",
      }),
    });
    expect(dispatchSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET_PENDING_TRACK_POSITION" }),
    );
  });

  it("when playing a different track on the same release instance, session handoff does not preserve the old active track index", () => {
    const releaseTracks = [
      discogsTrackFactory.build({
        position: "A1",
        title: "Track A1",
        type_: "track",
      }),
      discogsTrackFactory.build({
        position: "A2",
        title: "Track A2",
        type_: "track",
      }),
    ];
    const release = releaseFactory.withDisplayDefaults({
      tracklist: releaseTracks,
    });
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const syncEmbedForQueueItem = jest.fn(() => "abc12345678");
    const item = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Track A2",
    });

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem,
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: false },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: {
            current: releaseTracks,
          },
          lastSyncedActiveVideoIdRef: { current: "abc12345678" },
          matchedActiveVideoIdRef: { current: "abc12345678" },
          activeVideoIdRef: { current: "abc12345678" },
          embedVideoIdRef: { current: "abc12345678" },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release,
      trackPosition: "A2",
      trackTitle: "Track A2",
      rebuildAlbumQueue: false,
      startQueueItem: item,
      upcomingQueue: [],
    });

    const playCallOrder = (
      dispatchSession as jest.MockedFunction<typeof dispatchSession>
    ).mock.calls.map((call) => (call[0] as PlaybackSessionAction).type);
    const playIndex = playCallOrder.indexOf("PLAY_QUEUE_ITEM");
    const resolveIndex = playCallOrder.indexOf("RESOLVE_PENDING_TRACK");

    expect(dispatchSession).toHaveBeenCalledWith({
      type: "PLAY_QUEUE_ITEM",
      params: expect.objectContaining({
        isSameRelease: false,
        pendingTrackPosition: null,
      }),
    });
    expect(resolveIndex).toBeGreaterThan(playIndex);
    expect(dispatchSession).toHaveBeenCalledWith({
      type: "RESOLVE_PENDING_TRACK",
      index: 1,
      resumeTransport: true,
    });
  });

  it("when switching releases with an explicit youtubeVideoId before detail loads, resolves the target track without pending", () => {
    const currentRelease = releaseFactory.withDisplayDefaults();
    const nextRelease = releaseFactory.withDisplayDefaults({
      basic_information: { id: 2002, title: "Next album" },
      instance_id: "inst-next",
      tracklist: [
        discogsTrackFactory.build({
          position: "A2",
          title: "Track A2",
          type_: "track",
        }),
      ],
    });
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const sharedVideoId = "abc12345678";

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => null),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: false },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: currentRelease },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: currentRelease.basic_information.id },
          tracksRef: {
            current: [
              discogsTrackFactory.build({
                position: "A1",
                title: "Track A1",
                type_: "track",
              }),
            ],
          },
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: null },
          activeVideoIdRef: { current: null },
          embedVideoIdRef: { current: null },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release: nextRelease,
      trackPosition: "A2",
      trackTitle: "Track A2",
      rebuildAlbumQueue: false,
      youtubeVideoId: sharedVideoId,
    });

    expect(dispatchSession).toHaveBeenCalledWith({
      type: "PLAY_QUEUE_ITEM",
      params: expect.objectContaining({
        pendingTrackPosition: null,
      }),
    });
    expect(dispatchSession).toHaveBeenCalledWith({
      type: "RESOLVE_PENDING_TRACK",
      index: 0,
      resumeTransport: true,
    });
  });

  it("playNext passes forceReload to syncEmbedForQueueItem after an unavailable skip advance", () => {
    const release = releaseFactory.withDisplayDefaults();
    const nextItem = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Side B",
    });
    const queueRef = { current: [nextItem] };
    const forceEmbedReloadAfterUnavailableSkipRef = { current: true };
    const embedVideoIdRef = { current: "abc12345678" as string | null };
    const syncEmbedForQueueItem = mockSyncEmbedForQueueItem(
      () => "abc12345678",
    );

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: jest.fn(),
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem,
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        forceEmbedReloadAfterUnavailableSkipRef,
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: false },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: "te2jJncBVG4" },
          activeVideoIdRef: { current: "te2jJncBVG4" },
          embedVideoIdRef,
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playNext();

    expect(forceEmbedReloadAfterUnavailableSkipRef.current).toBe(false);
    expect(syncEmbedForQueueItem).toHaveBeenCalledWith(nextItem, {
      forceReload: true,
    });
  });

  it("playNext passes forceReload to syncEmbedForQueueItem when repeating the active track", () => {
    const release = releaseFactory.withDisplayDefaults();
    const nextItem = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Replay",
    });
    const syncEmbedForQueueItem = mockSyncEmbedForQueueItem(
      (_item, _options) => "abc12345678",
    );
    const queueRef = { current: [nextItem] };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem,
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(
          (updater: (previous: (typeof nextItem)[]) => (typeof nextItem)[]) => {
            queueRef.current = updater(queueRef.current);
          },
        ),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: "abc12345678" },
          matchedActiveVideoIdRef: { current: "abc12345678" },
          activeVideoIdRef: { current: "abc12345678" },
          embedVideoIdRef: { current: "abc12345678" },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playNext();

    expect(syncEmbedForQueueItem).toHaveBeenCalledWith(nextItem, {
      forceReload: true,
    });
  });

  it("playNext prepares queue advance playback before advancing the queue", () => {
    const release = releaseFactory.withDisplayDefaults();
    const nextItem = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Next",
    });
    const { result, prepareQueueAdvancePlayback } = buildHarness({
      sessionQueue: [nextItem],
    });

    result.current.playNext();

    expect(prepareQueueAdvancePlayback).toHaveBeenCalledWith(nextItem, {
      forceEmbedReloadAfterUnavailableSkip: false,
    });
  });

  it("playPrevious confirms embed playback when history reuses the same YouTube upload", () => {
    const release = releaseFactory.withDisplayDefaults();
    const historyItem = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Same upload",
    });
    const sharedVideoId = "abc12345678";
    const settleSameUploadQueueAdvance = jest.fn();
    const prepareQueueAdvancePlayback = jest.fn();
    const playbackHistoryRef = { current: [historyItem] };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback,
        settleSameUploadQueueAdvance,
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => sharedVideoId),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef: { current: [] },
          playbackHistoryRef,
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: sharedVideoId },
          matchedActiveVideoIdRef: { current: sharedVideoId },
          activeVideoIdRef: { current: sharedVideoId },
          embedVideoIdRef: { current: sharedVideoId },
          activeTrackPositionRef: { current: "A2" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playPrevious();

    expect(prepareQueueAdvancePlayback).toHaveBeenCalledWith(historyItem);
    expect(settleSameUploadQueueAdvance).toHaveBeenCalledTimes(1);
  });

  it("playPrevious prepares queue advance playback before playing history", () => {
    const release = releaseFactory.withDisplayDefaults();
    const historyItem = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Previous",
    });
    const prepareQueueAdvancePlayback = jest.fn();
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const playbackHistoryRef = { current: [historyItem] };
    const queueRef = { current: [] as ReturnType<typeof createQueueItem>[] };
    const releaseRef = { current: release };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback,
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => "abc12345678"),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef,
          queueRef,
          playbackHistoryRef,
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: "te2jJncBVG4" },
          activeVideoIdRef: { current: "te2jJncBVG4" },
          embedVideoIdRef: { current: null },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playPrevious();

    expect(prepareQueueAdvancePlayback).toHaveBeenCalledWith(historyItem);
  });

  it("enables similar tail mode on startPlayback only when extendQueueWithSimilarReleases is true", () => {
    const enabledHarness = buildHarness();
    enabledHarness.result.current.startPlayback({
      release: releaseFactory.withDisplayDefaults(),
      trackPosition: "A1",
    });
    expect(enabledHarness.similarQueueModeRef.current.enabled).toBe(true);

    const extendQueueWithSimilarReleasesRef = { current: false };
    const similarQueueModeRef = {
      current: createSimilarQueueMode(false),
    };
    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => null),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef,
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef,
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: releaseFactory.withDisplayDefaults() },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: false },
          isPausedRef: { current: false },
          releaseDetailIdRef: {
            current: releaseFactory.withDisplayDefaults().basic_information.id,
          },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: null },
          activeVideoIdRef: { current: null },
          embedVideoIdRef: { current: null },
          activeTrackPositionRef: { current: null },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release: releaseFactory.withDisplayDefaults(),
      trackPosition: "A1",
    });

    expect(similarQueueModeRef.current.enabled).toBe(false);
  });

  it("clearQueue empties the upcoming queue and turns off similar tail extension", () => {
    const existingItem = createQueueItem({
      release: releaseFactory.withDisplayDefaults(),
      trackPosition: "A1",
      trackTitle: "Queued",
    });
    const {
      result,
      queueManuallyExtendedRef,
      setUpcomingQueue,
      similarQueueModeRef,
      similarQueueSuppressedAfterClearRef,
    } = buildHarness({ sessionQueue: [existingItem] });

    result.current.clearQueue();

    expect(mockSetCollectionRadioActive).toHaveBeenCalledWith(false);
    expect(setUpcomingQueue).toHaveBeenCalledWith([]);
    expect(queueManuallyExtendedRef.current).toBe(false);
    expect(similarQueueModeRef.current.enabled).toBe(false);
    expect(similarQueueSuppressedAfterClearRef.current).toBe(true);
  });

  it("startPlayback clears collection radio active chrome", () => {
    const release = releaseFactory.withDisplayDefaults();
    const { result } = buildHarness();

    result.current.startPlayback({
      release,
      trackPosition: "A1",
      trackTitle: "Track",
      rebuildAlbumQueue: false,
    });

    expect(mockSetCollectionRadioActive).toHaveBeenCalledWith(false);
  });

  it("startPlayback with upcomingQueue does not reset dock progress when continuing the same YouTube upload", () => {
    const release = releaseFactory.withDisplayDefaults();
    const sharedVideoId = "abc12345678";
    const upcomingItem = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Track A2",
    });
    const resetDockEmbedProgress = jest.fn();
    const settleSameUploadQueueAdvance = jest.fn();

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress,
        dispatchSession: jest.fn() as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance,
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: mockSyncEmbedForQueueItem(() => sharedVideoId),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: false },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: true },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: sharedVideoId },
          matchedActiveVideoIdRef: { current: sharedVideoId },
          activeVideoIdRef: { current: sharedVideoId },
          embedVideoIdRef: { current: sharedVideoId },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release,
      trackPosition: "A2",
      trackTitle: "Track A2",
      rebuildAlbumQueue: false,
      upcomingQueue: [upcomingItem],
    });

    expect(resetDockEmbedProgress).not.toHaveBeenCalled();
    expect(settleSameUploadQueueAdvance).toHaveBeenCalledTimes(1);
  });

  it("startPlayback with upcomingQueue does not forceReload the embed when transport is already on the same upload", () => {
    const release = releaseFactory.withDisplayDefaults();
    const upcomingItem = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Track A2",
    });
    const syncEmbedForQueueItem = mockSyncEmbedForQueueItem(
      () => "abc12345678",
    );

    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem,
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        resetPlaybackSkipState: jest.fn(),
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: false },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: false },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: { current: [] },
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: "te2jJncBVG4" },
          activeVideoIdRef: { current: "te2jJncBVG4" },
          embedVideoIdRef: { current: "abc12345678" },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release,
      trackPosition: "A2",
      trackTitle: "Track A2",
      rebuildAlbumQueue: false,
      upcomingQueue: [upcomingItem],
    });

    expect(syncEmbedForQueueItem).toHaveBeenCalledWith(
      expect.objectContaining({ trackPosition: "A2" }),
      { forceReload: false },
    );
  });

  it("startPlayback uses startQueueItem metadata when provided", () => {
    const release = releaseFactory.withDisplayDefaults({
      tracklist: [
        discogsTrackFactory.build({
          position: "A",
          title: "Radio track",
          type_: "track",
        }),
      ],
    });
    const startQueueItem = createQueueItem({
      release,
      trackPosition: "A",
      trackTitle: "Radio track",
    });
    startQueueItem.fromCollectionRadio = true;
    const setNowPlayingQueueItem = jest.fn();
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession,
        setNowPlayingQueueItem,
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => "abc12345678"),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(false) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: false },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef: { current: release },
          queueRef: { current: [] },
          playbackHistoryRef: { current: [] },
          isPlayingRef: { current: false },
          isPausedRef: { current: false },
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef: {
            current: [
              discogsTrackFactory.build({
                position: "A1",
                title: "Other",
                type_: "track",
              }),
            ],
          },
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: "te2jJncBVG4" },
          activeVideoIdRef: { current: "te2jJncBVG4" },
          embedVideoIdRef: { current: "abc12345678" },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.startPlayback({
      release,
      trackPosition: "A",
      trackTitle: "Ignored title",
      startQueueItem,
      rebuildAlbumQueue: false,
      upcomingQueue: [],
    });

    expect(setNowPlayingQueueItem).toHaveBeenCalledWith(
      expect.objectContaining({
        fromCollectionRadio: true,
        trackTitle: "Radio track",
      }),
    );
  });

  it("stopPlayback clears collection radio active chrome", () => {
    const { result } = buildHarness();

    result.current.stopPlayback();

    expect(mockSetCollectionRadioActive).toHaveBeenCalledWith(false);
  });

  it("stopPlayback clears persisted session state and stops transport", () => {
    writePersistedReleasePlayback({
      instanceId: "instance-1",
      trackPosition: "A1",
    });

    const { result, dispatchSession, resetEmbedSession } = buildHarness();

    result.current.stopPlayback();

    expect(dispatchSession).toHaveBeenCalledWith({ type: "STOP" });
    expect(resetEmbedSession).toHaveBeenCalledTimes(1);
    expect(readPersistedReleasePlayback()).toBeNull();
  });

  it("addToQueue auto-starts playback when tryAutoStartOnEmptyQueue succeeds", () => {
    const release = releaseFactory.withDisplayDefaults();
    const { result, dispatchSession } = buildHarness({
      tryAutoStartOnEmptyQueue: (start) => {
        start();
        return true;
      },
    });

    result.current.addToQueue({
      release,
      trackPosition: "A1",
      trackTitle: "Track A1",
    });

    expect(dispatchSession).toHaveBeenCalledWith(
      expect.objectContaining({ type: "PLAY_QUEUE_ITEM" }),
    );
  });

  it("addToQueue appends a manual queue item when auto-start does not run", () => {
    const release = releaseFactory.withDisplayDefaults();
    const { result, queueRef, updateUpcomingQueue } = buildHarness({
      sessionQueue: [
        createQueueItem({
          release,
          trackPosition: "A1",
          trackTitle: "Current",
        }),
      ],
    });

    result.current.addToQueue({
      release,
      trackPosition: "B1",
      trackTitle: "Next up",
    });

    expect(updateUpcomingQueue).toHaveBeenCalled();
    expect(queueRef.current).toHaveLength(2);
  });

  it("addToQueue marks manual curation and skips deferred album-tail rebuild", () => {
    const release = releaseFactory.withDisplayDefaults();
    const { result, queueManuallyExtendedRef, shouldRebuildAlbumQueueRef } =
      buildHarness({
        sessionQueue: [
          createQueueItem({
            release,
            trackPosition: "A1",
            trackTitle: "Current",
          }),
        ],
      });

    shouldRebuildAlbumQueueRef.current = true;
    queueManuallyExtendedRef.current = false;

    result.current.addToQueue({
      release,
      trackPosition: "B1",
      trackTitle: "Next up",
    });

    expect(queueManuallyExtendedRef.current).toBe(true);
    expect(shouldRebuildAlbumQueueRef.current).toBe(false);
  });

  it("reorderQueue marks manual curation and skips deferred album-tail rebuild", () => {
    const release = releaseFactory.withDisplayDefaults();
    const first = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Second",
    });
    const {
      result,
      queueManuallyExtendedRef,
      setUpcomingQueue,
      shouldRebuildAlbumQueueRef,
    } = buildHarness({ sessionQueue: [first, second] });

    shouldRebuildAlbumQueueRef.current = true;
    queueManuallyExtendedRef.current = false;

    result.current.reorderQueue(0, 1);

    expect(setUpcomingQueue).toHaveBeenCalledWith([second, first]);
    expect(queueManuallyExtendedRef.current).toBe(true);
    expect(shouldRebuildAlbumQueueRef.current).toBe(false);
  });

  it("replaceUpcomingQueue replaces the upcoming list and disables similar queue mode", () => {
    const release = releaseFactory.withDisplayDefaults();
    const queued = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "Queued",
    });
    const replacement = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Replacement",
    });
    const {
      result,
      queueManuallyExtendedRef,
      setUpcomingQueue,
      similarQueueModeRef,
      similarQueueSuppressedAfterClearRef,
    } = buildHarness({ sessionQueue: [queued] });

    queueManuallyExtendedRef.current = false;
    similarQueueModeRef.current = createSimilarQueueMode(true);
    similarQueueSuppressedAfterClearRef.current = true;

    result.current.replaceUpcomingQueue([replacement]);

    expect(setUpcomingQueue).toHaveBeenCalledWith([replacement]);
    expect(queueManuallyExtendedRef.current).toBe(true);
    expect(similarQueueModeRef.current.enabled).toBe(false);
    expect(similarQueueSuppressedAfterClearRef.current).toBe(false);
  });

  it("PLAY_QUEUE_ITEM includes pending track position when release detail is not ready to resolve the target track", () => {
    const release = releaseFactory.withDisplayDefaults();
    const queuedItem = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Track B1",
    });
    const dispatchSession = jest.fn();
    const queueRef = { current: [queuedItem] };
    const releaseRef = { current: release };
    const tracksRef = {
      current: [] as ReturnType<typeof discogsTrackFactory.build>[],
    };
    const isPlayingRef = { current: true };
    const isPausedRef = { current: false };

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        resetDockEmbedProgress: jest.fn(),
        dispatchSession: dispatchSession as Dispatch<PlaybackSessionAction>,
        setNowPlayingQueueItem: jest.fn(),
        setPlaybackTrackTitleOverride: jest.fn(),
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
        setPlaybackVideoTransitionTargetId: jest.fn(),
        setPlaybackVideoUiLoadingTargetId: jest.fn(),
        clearPlaybackVideoUiLoading: jest.fn(),
        resetEmbedSession: jest.fn(),
        beginPlaybackVideoUiLoading: jest.fn(),
        markEmbedTrackSwitchGrace: jest.fn(),
        prepareQueueAdvancePlayback: jest.fn(),
        settleSameUploadQueueAdvance: jest.fn(),
        setEmbedVideoId: jest.fn(),
        clearPlayFromGestureRetries: jest.fn(),
        syncEmbedToVideoId: jest.fn(),
        syncEmbedForQueueItem: jest.fn(() => "abc12345678"),
        prefetchQueueItemEmbed: jest.fn(),
        setUpcomingQueue: jest.fn(),
        updateUpcomingQueue: jest.fn(),
        maybePushCurrentToHistory: jest.fn(),
        prependCurrentToUpcoming: jest.fn(),
        tryAutoStartOnEmptyQueue: () => false,
        extendQueueTail: async () => false,
        playNextRef: { current: () => {} },
        extendQueueTailRef: { current: async () => false },
        startPlaybackRef: { current: () => {} },
        refs: {
          awaitingResumeGestureRef: { current: false },
          pendingPlayFromGestureRef: { current: false },
          shouldRebuildAlbumQueueRef: { current: false },
          similarQueueModeRef: { current: createSimilarQueueMode(true) },
          similarQueueGenerationRef: { current: 0 },
          extendQueueWithSimilarReleasesRef: { current: true },
          similarQueueTailToastShownRef: { current: false },
          queueManuallyExtendedRef: { current: false },
          similarQueueSuppressedAfterClearRef: { current: false },
          releaseRef,
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef,
          isPausedRef,
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef,
          lastSyncedActiveVideoIdRef: { current: null },
          matchedActiveVideoIdRef: { current: "te2jJncBVG4" },
          activeVideoIdRef: { current: "te2jJncBVG4" },
          embedVideoIdRef: { current: "te2jJncBVG4" },
          activeTrackPositionRef: { current: "A1" },
          isReleasePreviewRef: { current: false },
        },
      }),
    );

    result.current.playNext();

    expect(dispatchSession).toHaveBeenCalledWith({
      type: "PLAY_QUEUE_ITEM",
      params: expect.objectContaining({
        pendingTrackPosition: "B1",
      }),
    });
    expect(dispatchSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET_PENDING_TRACK_POSITION" }),
    );
  });

  it("removeFromQueue suppresses similar tail when dismissing a generated row", () => {
    const similarItem = createQueueItem({
      release: releaseFactory.withDisplayDefaults(),
      trackPosition: "A1",
      trackTitle: "Similar pick",
    });
    similarItem.fromSimilarRelease = true;
    const {
      result,
      setUpcomingQueue,
      similarQueueModeRef,
      similarQueueSuppressedAfterClearRef,
    } = buildHarness({ sessionQueue: [similarItem] });

    result.current.removeFromQueue(0);

    expect(setUpcomingQueue).toHaveBeenCalledWith([]);
    expect(similarQueueModeRef.current.enabled).toBe(false);
    expect(similarQueueSuppressedAfterClearRef.current).toBe(true);
  });

  it("removeAlbumTracksFromQueue drops matching album rows for one release", () => {
    const release = releaseFactory.withDisplayDefaults();
    const first = createQueueItem({
      release,
      trackPosition: "A",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release,
      trackPosition: "B",
      trackTitle: "Second",
    });
    const otherReleaseItem = createQueueItem({
      release: releaseFactory.withDisplayDefaults({ instance_id: "999" }),
      trackPosition: "A1",
      trackTitle: "Other",
    });
    const { result, updateUpcomingQueue, queueRef } = buildHarness({
      sessionQueue: [first, second, otherReleaseItem],
    });

    result.current.removeAlbumTracksFromQueue({
      release,
      trackPositions: ["A", "B"],
    });

    expect(updateUpcomingQueue).toHaveBeenCalled();
    expect(queueRef.current).toEqual([otherReleaseItem]);
  });

  it("removeFromQueue drops the item at the requested index", () => {
    const first = createQueueItem({
      release: releaseFactory.withDisplayDefaults(),
      trackPosition: "A1",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release: releaseFactory.withDisplayDefaults(),
      trackPosition: "B1",
      trackTitle: "Second",
    });
    const { result, setUpcomingQueue } = buildHarness({
      sessionQueue: [first, second],
    });

    result.current.removeFromQueue(0);

    expect(setUpcomingQueue).toHaveBeenCalledWith([second]);
  });
});
