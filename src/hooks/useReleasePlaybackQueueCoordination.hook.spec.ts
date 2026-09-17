import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Dispatch } from "react";
import { useReleasePlaybackQueueCoordination } from "src/hooks/useReleasePlaybackQueueCoordination.hook";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import { createQueueItem } from "src/utils/playbackQueue";
import type { PlaybackSessionAction } from "src/utils/playbackSessionState";
import {
  readPersistedReleasePlayback,
  writePersistedReleasePlayback,
} from "src/utils/releasePlaybackStorage";
import { renderHook } from "test-utils";

describe("useReleasePlaybackQueueCoordination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const buildHarness = ({
    isPlaying = false,
    sessionQueue = [] as ReturnType<typeof createQueueItem>[],
  } = {}) => {
    const dispatchSession = jest.fn() as Dispatch<PlaybackSessionAction>;
    const release = releaseFactory.withDisplayDefaults();
    const activeTrack = {
      position: "A1",
      title: "Track A1",
      type_: "track",
      duration: "3:00",
    };
    const releaseRef = { current: release as DiscogsRelease | null };
    const queueRef = { current: sessionQueue };
    const isPlayingRef = { current: isPlaying };
    const tracksRef = { current: [activeTrack] };
    const activeTrackIndexRef = { current: 0 };
    const previewVideoRef = { current: null };
    const autoPlayOnQueueAddRef = { current: true };
    const embedVideoIdRef = { current: null as string | null };
    const lastSyncedActiveVideoIdRef = { current: null as string | null };
    const setEmbedVideoId = jest.fn();
    const setShouldAutoplayEmbed = jest.fn();

    const { result, rerender } = renderHook(
      ({ queue }) =>
        useReleasePlaybackQueueCoordination({
          autoPlayOnQueueAddRef,
          dispatchSession,
          embedVideoIdRef,
          isPlayingRef,
          lastSyncedActiveVideoIdRef,
          previewVideoRef,
          queueRef,
          releaseRef,
          sessionQueue: queue,
          activeTrackIndexRef,
          tracksRef,
          setEmbedVideoId,
          setShouldAutoplayEmbed,
        }),
      { initialProps: { queue: sessionQueue } },
    );

    return {
      result,
      rerender,
      dispatchSession,
      queueRef,
      releaseRef,
      isPlayingRef,
      setEmbedVideoId,
      setShouldAutoplayEmbed,
      embedVideoIdRef,
      lastSyncedActiveVideoIdRef,
    };
  };

  it("aborts unresolved playback and clears persisted session state", () => {
    writePersistedReleasePlayback({
      instanceId: "instance-123",
      trackPosition: "A1",
    });

    const { result, dispatchSession, setEmbedVideoId, setShouldAutoplayEmbed } =
      buildHarness();

    result.current.abortUnresolvedPlayback();

    expect(dispatchSession).toHaveBeenCalledWith({ type: "STOP" });
    expect(setShouldAutoplayEmbed).toHaveBeenCalledWith(false);
    expect(setEmbedVideoId).toHaveBeenCalledWith(null);
    expect(readPersistedReleasePlayback()).toBeNull();
  });

  it("persists the active track and upcoming queue while playing", () => {
    const release = releaseFactory.withDisplayDefaults();
    const upcoming = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Track B1",
    });
    const harness = buildHarness({ isPlaying: true, sessionQueue: [upcoming] });
    harness.releaseRef.current = release;
    harness.queueRef.current = [upcoming];

    harness.result.current.persistPlaybackSession();

    expect(readPersistedReleasePlayback()).toEqual({
      instanceId: String(release.instance_id),
      trackPosition: "A1",
      queue: [
        {
          instanceId: String(release.instance_id),
          trackPosition: "B1",
          trackTitle: "Track B1",
        },
      ],
    });
  });

  it("auto-starts playback on an empty queue when nothing is active yet", () => {
    const start = jest.fn();
    const harness = buildHarness();
    harness.releaseRef.current = null;

    expect(harness.result.current.tryAutoStartOnEmptyQueue(start)).toBe(true);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("syncs session queue into the queue ref when the session queue changes", () => {
    const release = releaseFactory.withDisplayDefaults();
    const firstItem = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "A1",
    });
    const harness = buildHarness({ sessionQueue: [firstItem] });

    expect(harness.queueRef.current).toEqual([firstItem]);

    const secondItem = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "A2",
    });
    harness.rerender({ queue: [firstItem, secondItem] });

    expect(harness.queueRef.current).toEqual([firstItem, secondItem]);
  });
});
