import { describe, expect, it } from "@jest/globals";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { ReleasePlaybackState } from "src/types/releasePlaybackContext.types";
import { createQueueItem } from "src/utils/playbackQueue";
import {
  buildPlaylistUpcomingAfterTrackKey,
  isPlaylistTrackActiveInPlayback,
  planPlaylistPlaybackStart,
  resolvePlaylistTracksToQueueItems,
  resolvePlaylistTrackToQueueItem,
  shouldSyncUpcomingQueueToPlaylistOrder,
} from "src/utils/playlistPlayback";

const playbackStateWithRelease = (
  release: ReturnType<typeof releaseFactory.withDisplayDefaults>,
  activeTrackPosition: string,
  overrides: Partial<ReleasePlaybackState> = {},
): Pick<
  ReleasePlaybackState,
  "release" | "activeTrackPosition" | "isReleasePreview" | "isMiniPlayerVisible"
> => ({
  release,
  activeTrackPosition,
  isReleasePreview: false,
  isMiniPlayerVisible: true,
  ...overrides,
});

describe("resolvePlaylistTrackToQueueItem", () => {
  it("builds a queue item when the release is in the collection", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const trackRow = playlistTrackRowFactory.opening();

    const item = resolvePlaylistTrackToQueueItem(trackRow, [release]);

    expect(item).toEqual({
      instanceId: "9001",
      trackPosition: "A1",
      trackTitle: "Opening",
      release,
    });
  });

  it("returns null when the instance is not in the collection", () => {
    const trackRow = playlistTrackRowFactory.opening();

    expect(resolvePlaylistTrackToQueueItem(trackRow, [])).toBeNull();
  });
});

describe("resolvePlaylistTracksToQueueItems", () => {
  it("preserves playlist order and skips missing releases", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const playable = playlistTrackRowFactory.opening();
    const missing = playlistTrackRowFactory.opening({
      instance_id: "4040",
      track_key: "4040:B1",
      track_position: "B1",
    });

    const items = resolvePlaylistTracksToQueueItems(
      [playable, missing],
      [release],
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.trackPosition).toBe("A1");
  });
});

describe("planPlaylistPlaybackStart", () => {
  it("returns start row, queue item, and upcoming rows from the start key", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const tracks = [
      playlistTrackRowFactory.opening(),
      playlistTrackRowFactory.opening({
        track_key: "9001:A2",
        track_position: "A2",
        sort_order: 2,
      }),
    ];

    const plan = planPlaylistPlaybackStart(tracks, "9001:A1", [release]);

    expect(plan?.startItem.trackPosition).toBe("A1");
    expect(plan?.upcomingItems).toHaveLength(1);
    expect(plan?.upcomingItems[0]?.trackPosition).toBe("A2");
  });

  it("returns null when no playable row exists from the start key", () => {
    const tracks = [playlistTrackRowFactory.opening()];

    expect(planPlaylistPlaybackStart(tracks, "9001:A1", [])).toBeNull();
  });
});

describe("buildPlaylistUpcomingAfterTrackKey", () => {
  it("returns playable rows after the start key in playlist order", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const tracks = [
      playlistTrackRowFactory.opening(),
      playlistTrackRowFactory.opening({
        track_key: "9001:A2",
        track_position: "A2",
        sort_order: 2,
      }),
    ];

    const upcoming = buildPlaylistUpcomingAfterTrackKey(tracks, "9001:A1", [
      release,
    ]);

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]?.trackPosition).toBe("A2");
  });
});

describe("shouldSyncUpcomingQueueToPlaylistOrder", () => {
  it("returns true when upcoming rows follow playlist order after the active track", () => {
    const orderedKeys = ["9001:A1", "9001:A2", "9001:A3"];
    const upcoming = [
      createQueueItem({
        release: releaseFactory.withDisplayDefaults({ instance_id: 9001 }),
        trackPosition: "A2",
        trackTitle: "Second",
      }),
    ];

    expect(
      shouldSyncUpcomingQueueToPlaylistOrder(orderedKeys, "9001:A1", upcoming),
    ).toBe(true);
  });

  it("returns false when upcoming rows break playlist order", () => {
    const orderedKeys = ["9001:A1", "9001:A2", "9001:A3"];
    const upcoming = [
      createQueueItem({
        release: releaseFactory.withDisplayDefaults({ instance_id: 9001 }),
        trackPosition: "A1",
        trackTitle: "Opening",
      }),
    ];

    expect(
      shouldSyncUpcomingQueueToPlaylistOrder(orderedKeys, "9001:A2", upcoming),
    ).toBe(false);
  });
});

describe("isPlaylistTrackActiveInPlayback", () => {
  it("returns true when instance and track position match the active session", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const trackRow = playlistTrackRowFactory.opening();
    const playback = playbackStateWithRelease(release, "A1");

    expect(isPlaylistTrackActiveInPlayback(trackRow, playback)).toBe(true);
  });

  it("returns false when the position differs", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const trackRow = playlistTrackRowFactory.opening();
    const playback = playbackStateWithRelease(release, "B1");

    expect(isPlaylistTrackActiveInPlayback(trackRow, playback)).toBe(false);
  });

  it("returns false during release preview playback", () => {
    const release = releaseFactory.withDisplayDefaults({ instance_id: 9001 });
    const trackRow = playlistTrackRowFactory.opening();
    const playback = playbackStateWithRelease(release, "A1", {
      isReleasePreview: true,
    });

    expect(isPlaylistTrackActiveInPlayback(trackRow, playback)).toBe(false);
  });
});
