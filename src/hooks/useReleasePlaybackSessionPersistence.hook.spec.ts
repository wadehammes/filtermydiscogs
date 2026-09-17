import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
  usePersistPlaybackSessionOnQueueChange,
  usePersistPlaybackSessionWhilePlaying,
  useRestorePlaybackSessionFromStorage,
} from "src/hooks/useReleasePlaybackSessionPersistence.hook";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { renderHook } from "test-utils";

describe("useReleasePlaybackSessionPersistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe("usePersistPlaybackSessionOnQueueChange", () => {
    it("persists when the session queue is present", () => {
      const persistPlaybackSession = jest.fn();
      const release = releaseFactory.withDisplayDefaults();
      const sessionQueue = [
        createQueueItem({
          release,
          trackPosition: "A1",
          trackTitle: "Track A1",
        }),
      ];

      renderHook(() =>
        usePersistPlaybackSessionOnQueueChange({
          sessionQueue,
          persistPlaybackSession,
        }),
      );

      expect(persistPlaybackSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("usePersistPlaybackSessionWhilePlaying", () => {
    it("persists album playback when transport is active and a track position is known", () => {
      const persistPlaybackSession = jest.fn();
      const release = releaseFactory.withDisplayDefaults();

      renderHook(() =>
        usePersistPlaybackSessionWhilePlaying({
          isPlaying: true,
          release,
          pendingTrackPosition: null,
          activeTrackPosition: "A1",
          isReleasePreview: false,
          persistPlaybackSession,
        }),
      );

      expect(persistPlaybackSession).toHaveBeenCalledTimes(1);
    });

    it("skips persist while a pending track position is resolving", () => {
      const persistPlaybackSession = jest.fn();
      const release = releaseFactory.withDisplayDefaults();

      renderHook(() =>
        usePersistPlaybackSessionWhilePlaying({
          isPlaying: true,
          release,
          pendingTrackPosition: "B1",
          activeTrackPosition: "A1",
          isReleasePreview: false,
          persistPlaybackSession,
        }),
      );

      expect(persistPlaybackSession).not.toHaveBeenCalled();
    });

    it("persists release preview playback without an active album track", () => {
      const persistPlaybackSession = jest.fn();
      const release = releaseFactory.withDisplayDefaults();

      renderHook(() =>
        usePersistPlaybackSessionWhilePlaying({
          isPlaying: true,
          release,
          pendingTrackPosition: null,
          activeTrackPosition: null,
          isReleasePreview: true,
          persistPlaybackSession,
        }),
      );

      expect(persistPlaybackSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("useRestorePlaybackSessionFromStorage", () => {
    const buildRestoreHarness = (
      overrides: Partial<
        Parameters<typeof useRestorePlaybackSessionFromStorage>[0]
      > = {},
    ) => {
      const release = releaseFactory.withDisplayDefaults();
      const hasAttemptedRestoreRef = { current: false };
      const queueManuallyExtendedRef = { current: false };
      const setUpcomingQueue = jest.fn();
      const startPlaybackRef = {
        current: jest.fn(),
      };

      const defaults: Parameters<
        typeof useRestorePlaybackSessionFromStorage
      >[0] = {
        isPlaying: false,
        isCheckingAuth: false,
        isAuthenticated: true,
        fetchingCollection: false,
        collection: { pagination: { urls: {} } },
        allReleases: [release],
        hasMoreCollectionPages: false,
        hasAttemptedRestoreRef,
        queueManuallyExtendedRef,
        setUpcomingQueue,
        startPlaybackRef,
      };

      renderHook(() =>
        useRestorePlaybackSessionFromStorage({ ...defaults, ...overrides }),
      );

      return {
        hasAttemptedRestoreRef,
        queueManuallyExtendedRef,
        release,
        setUpcomingQueue,
        startPlaybackRef,
      };
    };

    it("marks restore attempted when nothing is persisted", () => {
      const { hasAttemptedRestoreRef, startPlaybackRef } =
        buildRestoreHarness();

      expect(hasAttemptedRestoreRef.current).toBe(true);
      expect(startPlaybackRef.current).not.toHaveBeenCalled();
    });

    it("clears persisted playback for signed-out users", () => {
      writePersistedReleasePlayback({
        instanceId: "1",
        trackPosition: "A1",
      });

      const { hasAttemptedRestoreRef } = buildRestoreHarness({
        isAuthenticated: false,
      });

      expect(readPersistedReleasePlayback()).toBeNull();
      expect(hasAttemptedRestoreRef.current).toBe(true);
    });

    it("restores queue and starts paused playback when the release is in the collection", () => {
      const release = releaseFactory.withDisplayDefaults();
      const queueRelease = releaseFactory.withDisplayDefaults();
      const queueItem = createQueueItem({
        release: queueRelease,
        trackPosition: "B1",
        trackTitle: "Track B1",
      });

      writePersistedReleasePlayback({
        instanceId: String(release.instance_id),
        trackPosition: "A1",
        queue: [
          {
            instanceId: String(queueRelease.instance_id),
            trackPosition: "B1",
            trackTitle: "Track B1",
          },
        ],
      });

      const { setUpcomingQueue, startPlaybackRef } = buildRestoreHarness({
        allReleases: [release, queueRelease],
      });

      expect(setUpcomingQueue).toHaveBeenCalledWith([queueItem]);
      expect(startPlaybackRef.current).toHaveBeenCalledWith({
        release,
        trackPosition: "A1",
        startPaused: true,
        rebuildAlbumQueue: false,
      });
    });

    it("clears stale persisted playback when the release never appears in the collection", () => {
      writePersistedReleasePlayback({
        instanceId: "missing-instance",
        trackPosition: "A1",
      });

      const { hasAttemptedRestoreRef } = buildRestoreHarness({
        allReleases: [],
        hasMoreCollectionPages: false,
      });

      expect(readPersistedReleasePlayback()).toBeNull();
      expect(hasAttemptedRestoreRef.current).toBe(true);
    });

    it("waits for more collection pages before clearing a missing release", () => {
      writePersistedReleasePlayback({
        instanceId: "missing-instance",
        trackPosition: "A1",
      });

      const { hasAttemptedRestoreRef } = buildRestoreHarness({
        allReleases: [],
        hasMoreCollectionPages: true,
      });

      expect(readPersistedReleasePlayback()).not.toBeNull();
      expect(hasAttemptedRestoreRef.current).toBe(false);
    });
  });
});
