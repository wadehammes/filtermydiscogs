import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Dispatch } from "react";
import { useReleasePlaybackQueueActions } from "src/hooks/useReleasePlaybackQueueActions.hook";
import { createSimilarQueueMode } from "src/hooks/useReleasePlaybackSimilarQueue.hook";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import {
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { renderHook } from "test-utils";

jest.mock("src/analytics/productAnalyticsEvents", () => ({
  trackPlaybackQueued: jest.fn(),
  trackPlaybackStarted: jest.fn(),
}));

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
  const similarQueueGenerationRef = { current: 0 };
  const queueManuallyExtendedRef = { current: true };
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
  const embedVideoIdRef = { current: null as string | null };
  const playNextRef = { current: () => {} };
  const extendQueueTailRef = {
    current: async () => false,
  };
  const startPlaybackRef = { current: () => {} };

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
      dispatchSession,
      setShouldAutoplayEmbed: jest.fn(),
      setIsPlaybackEmbedMounted: jest.fn(),
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
        queueManuallyExtendedRef,
        releaseRef,
        queueRef,
        playbackHistoryRef,
        isPlayingRef,
        releaseDetailIdRef,
        tracksRef,
        lastSyncedActiveVideoIdRef,
        embedVideoIdRef,
      },
    }),
  );

  return {
    dispatchSession,
    queueManuallyExtendedRef,
    queueRef,
    result,
    similarQueueModeRef,
    setUpcomingQueue,
    updateUpcomingQueue,
  };
};

describe("useReleasePlaybackQueueActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
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
    } = buildHarness({ sessionQueue: [existingItem] });

    result.current.clearQueue();

    expect(setUpcomingQueue).toHaveBeenCalledWith([]);
    expect(queueManuallyExtendedRef.current).toBe(false);
    expect(similarQueueModeRef.current.enabled).toBe(false);
  });

  it("stopPlayback clears persisted session state and stops transport", () => {
    writePersistedReleasePlayback({
      instanceId: "instance-1",
      trackPosition: "A1",
    });

    const { result, dispatchSession } = buildHarness();

    result.current.stopPlayback();

    expect(dispatchSession).toHaveBeenCalledWith({ type: "STOP" });
    expect(readPersistedReleasePlayback()).toBeNull();
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

    const { result } = renderHook(() =>
      useReleasePlaybackQueueActions({
        dispatchSession: dispatchSession as Dispatch<PlaybackSessionAction>,
        setShouldAutoplayEmbed: jest.fn(),
        setIsPlaybackEmbedMounted: jest.fn(),
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
          queueManuallyExtendedRef: { current: false },
          releaseRef,
          queueRef,
          playbackHistoryRef: { current: [] },
          isPlayingRef,
          releaseDetailIdRef: { current: release.basic_information.id },
          tracksRef,
          lastSyncedActiveVideoIdRef: { current: null },
          embedVideoIdRef: { current: "te2jJncBVG4" },
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
