import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type { PlaybackQueueItem } from "src/types/playbackQueue.types";
import { createQueueItem } from "src/utils/playbackQueue";

const mockStartPlayback = jest.fn();
const mockAddToQueue = jest.fn();
const mockClearQueue = jest.fn();
const mockReplaceUpcomingQueue = jest.fn();

const playbackSession = {
  isMiniPlayerVisible: false,
  isPlaying: false,
  autoPlayOnQueueAdd: true,
  release: null as DiscogsRelease | null,
  activeTrackPosition: null as string | null,
  isReleasePreview: false,
  queue: [] as PlaybackQueueItem[],
};

jest.mock("src/context/releasePlayback.context", () => ({
  useReleasePlayback: () => ({
    startPlayback: mockStartPlayback,
    addToQueue: mockAddToQueue,
    clearQueue: mockClearQueue,
    replaceUpcomingQueue: mockReplaceUpcomingQueue,
    ...playbackSession,
  }),
}));

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useAllReleases: () => [
    releaseFactory.withDisplayDefaults({ instance_id: 9001 }),
  ],
}));

jest.mock("src/utils/playbackQueueToast", () => ({
  showPlaybackQueueSuccessToast: jest.fn(),
}));

let usePlaylistPlayback: typeof import("src/hooks/usePlaylistPlayback.hook")["usePlaylistPlayback"];

beforeEach(async () => {
  jest.clearAllMocks();
  playbackSession.isMiniPlayerVisible = false;
  playbackSession.isPlaying = false;
  playbackSession.autoPlayOnQueueAdd = true;
  playbackSession.release = null;
  playbackSession.activeTrackPosition = null;
  playbackSession.isReleasePreview = false;
  playbackSession.queue = [];
  ({ usePlaylistPlayback } = await import(
    "src/hooks/usePlaylistPlayback.hook"
  ));
});

describe("usePlaylistPlayback", () => {
  it("starts playback on the first playable row and queues the rest", () => {
    const tracks = [
      playlistTrackRowFactory.opening(),
      playlistTrackRowFactory.opening({
        track_key: "9001:A2",
        track_position: "A2",
        sort_order: 2,
        track_title: "Second",
      }),
    ];

    const { result } = renderHook(() => usePlaylistPlayback());

    result.current.playPlaylistTracks(tracks);

    expect(mockClearQueue).toHaveBeenCalled();
    expect(mockStartPlayback).toHaveBeenCalledWith(
      expect.objectContaining({
        trackPosition: "A1",
        rebuildAlbumQueue: false,
        startPaused: false,
      }),
    );
    expect(mockReplaceUpcomingQueue).toHaveBeenCalledWith([
      expect.objectContaining({ trackPosition: "A2" }),
    ]);
    expect(mockAddToQueue).not.toHaveBeenCalled();
  });

  it("playPlaylistTrack starts at the clicked row and queues later playlist rows", () => {
    const secondTrack = playlistTrackRowFactory.opening({
      track_key: "9001:A2",
      track_position: "A2",
      sort_order: 2,
      track_title: "Second",
    });
    const tracks = [
      playlistTrackRowFactory.opening(),
      secondTrack,
      playlistTrackRowFactory.opening({
        track_key: "9001:A3",
        track_position: "A3",
        sort_order: 3,
        track_title: "Third",
      }),
    ];

    const { result } = renderHook(() => usePlaylistPlayback());

    result.current.playPlaylistTrack(secondTrack, tracks);

    expect(mockClearQueue).toHaveBeenCalled();
    expect(mockStartPlayback).toHaveBeenCalledWith(
      expect.objectContaining({
        trackPosition: "A2",
        rebuildAlbumQueue: false,
      }),
    );
    expect(mockReplaceUpcomingQueue).toHaveBeenCalledWith([
      expect.objectContaining({ trackPosition: "A3" }),
    ]);
  });

  it("syncPlaylistQueueToTrackOrder replaces the upcoming queue when it no longer matches playlist order", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const tracks = [
      playlistTrackRowFactory.opening(),
      playlistTrackRowFactory.opening({
        track_key: "9001:A2",
        track_position: "A2",
        sort_order: 2,
        track_title: "Second",
      }),
      playlistTrackRowFactory.opening({
        track_key: "9001:A3",
        track_position: "A3",
        sort_order: 3,
        track_title: "Third",
      }),
    ];

    playbackSession.isMiniPlayerVisible = true;
    playbackSession.isPlaying = true;
    playbackSession.release = release;
    playbackSession.activeTrackPosition = "A1";
    playbackSession.queue = [
      createQueueItem({
        release,
        trackPosition: "A3",
        trackTitle: "Third",
      }),
    ];

    const { result } = renderHook(() => usePlaylistPlayback());

    result.current.syncPlaylistQueueToTrackOrder(tracks);

    expect(mockReplaceUpcomingQueue).toHaveBeenCalledWith([
      expect.objectContaining({ trackPosition: "A2" }),
      expect.objectContaining({ trackPosition: "A3" }),
    ]);
  });

  it("addPlaylistToQueue appends playable rows without clearing or replacing the queue when transport is active", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const tracks = [
      playlistTrackRowFactory.opening(),
      playlistTrackRowFactory.opening({
        track_key: "9001:A2",
        track_position: "A2",
        sort_order: 2,
        track_title: "Second",
      }),
    ];

    playbackSession.isMiniPlayerVisible = true;
    playbackSession.isPlaying = true;
    playbackSession.release = release;
    playbackSession.activeTrackPosition = "B1";

    const { result } = renderHook(() => usePlaylistPlayback());

    result.current.addPlaylistToQueue(tracks);

    expect(mockClearQueue).not.toHaveBeenCalled();
    expect(mockStartPlayback).not.toHaveBeenCalled();
    expect(mockReplaceUpcomingQueue).not.toHaveBeenCalled();
    expect(mockAddToQueue).toHaveBeenCalledTimes(2);
    expect(mockAddToQueue).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ trackPosition: "A1", trackTitle: "Opening" }),
    );
    expect(mockAddToQueue).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ trackPosition: "A2", trackTitle: "Second" }),
    );
  });

  it("addPlaylistToQueue starts the first row when nothing is playing yet", () => {
    const tracks = [
      playlistTrackRowFactory.opening(),
      playlistTrackRowFactory.opening({
        track_key: "9001:A2",
        track_position: "A2",
        sort_order: 2,
        track_title: "Second",
      }),
    ];

    const { result } = renderHook(() => usePlaylistPlayback());

    result.current.addPlaylistToQueue(tracks);

    expect(mockClearQueue).not.toHaveBeenCalled();
    expect(mockStartPlayback).toHaveBeenCalledWith(
      expect.objectContaining({
        trackPosition: "A1",
        rebuildAlbumQueue: false,
      }),
    );
    expect(mockStartPlayback.mock.calls[0]?.[0]).not.toHaveProperty(
      "startPaused",
    );
    expect(mockAddToQueue).toHaveBeenCalledTimes(1);
    expect(mockAddToQueue).toHaveBeenCalledWith(
      expect.objectContaining({ trackPosition: "A2" }),
    );
    expect(mockReplaceUpcomingQueue).not.toHaveBeenCalled();
  });
});
