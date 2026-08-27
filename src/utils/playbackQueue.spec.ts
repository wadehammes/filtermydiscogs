import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import {
  adjustQueueIndexAfterReorder,
  appendQueueItem,
  buildFullPlayableAlbumQueue,
  buildPlayableAlbumQueue,
  clearQueueKeepingActiveItem,
  createPreviewQueueItem,
  createQueueItem,
  findQueueItemIndex,
  getQueueItemKey,
  insertQueueItemForPlayNow,
  isSameQueueItem,
  removeQueueItemAtIndex,
  reorderQueueItems,
  shuffleQueueItems,
} from "./playbackQueue";

describe("playbackQueue", () => {
  const release = releaseFactory.build({ instance_id: "101" });
  const otherRelease = releaseFactory.build({ instance_id: "202" });

  const tracks: DiscogsTrack[] = [
    { position: "A1", title: "First", type_: "track" },
    { position: "A2", title: "Second", type_: "track" },
    { position: "B1", title: "Third", type_: "track" },
  ];

  const videos: DiscogsVideo[] = [
    {
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "First",
      embed: true,
    },
    {
      uri: "https://www.youtube.com/watch?v=def98765432",
      title: "Second",
      embed: true,
    },
  ];

  it("creates stable queue item keys", () => {
    const item = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });

    expect(getQueueItemKey(item)).toBe("101:A1");
    expect(
      isSameQueueItem(item, {
        instanceId: "101",
        trackPosition: "A1",
      }),
    ).toBe(true);
  });

  it("creates preview queue items with synthetic positions", () => {
    const item = createPreviewQueueItem({
      release,
      video: {
        uri: "https://www.youtube.com/watch?v=abc12345678",
        title: "Full Album Upload",
        embed: true,
      },
    });

    expect(item.previewVideoUri).toBe(
      "https://www.youtube.com/watch?v=abc12345678",
    );
    expect(item.trackPosition.startsWith("preview:")).toBe(true);
    expect(item.trackTitle).toBe("Full Album Upload");
  });

  it("builds playable album queue from a start position", () => {
    const queue = buildPlayableAlbumQueue({
      release,
      tracks,
      videos,
      startPosition: "A2",
    });

    expect(queue.map((item) => item.trackPosition)).toEqual(["A2"]);
  });

  it("builds a full playable album queue from the first matched track", () => {
    const queue = buildFullPlayableAlbumQueue({
      release,
      tracks,
      videos,
    });

    expect(queue.map((item) => item.trackPosition)).toEqual(["A1", "A2"]);
  });

  it("returns an empty queue when the start track has no matched video", () => {
    const queue = buildPlayableAlbumQueue({
      release,
      tracks,
      videos,
      startPosition: "B1",
    });

    expect(queue).toEqual([]);
  });

  it("appends unique queue items", () => {
    const first = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });
    const duplicate = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release: otherRelease,
      trackPosition: "B1",
      trackTitle: "Other",
    });

    expect(appendQueueItem([first], duplicate)).toEqual([first]);
    expect(appendQueueItem([first], second)).toEqual([first, second]);
  });

  it("inserts a play-now item after the active row when playback is running", () => {
    const first = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Second",
    });
    const third = createQueueItem({
      release: otherRelease,
      trackPosition: "B1",
      trackTitle: "Other",
    });
    const queue = [first, second];

    expect(insertQueueItemForPlayNow(queue, third, 0, true)).toEqual({
      queue: [first, third, second],
      playIndex: 1,
    });
  });

  it("inserts a play-now item at the front when the queue is idle", () => {
    const queued = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Second",
    });
    const playNow = createQueueItem({
      release: otherRelease,
      trackPosition: "B1",
      trackTitle: "Other",
    });

    expect(insertQueueItemForPlayNow([queued], playNow, 0, false)).toEqual({
      queue: [playNow, queued],
      playIndex: 0,
    });
  });

  it("shuffles queue items", () => {
    const first = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Second",
    });
    const third = createQueueItem({
      release: otherRelease,
      trackPosition: "B1",
      trackTitle: "Third",
    });

    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    expect(
      shuffleQueueItems([first, second, third]).map((item) => item.trackTitle),
    ).toEqual(["Second", "Third", "First"]);

    randomSpy.mockRestore();
  });

  it("finds and removes queue items by index", () => {
    const first = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Second",
    });
    const queue = [first, second];

    expect(findQueueItemIndex(queue, second)).toBe(1);
    expect(removeQueueItemAtIndex(queue, 0)).toEqual([second]);
  });

  it("reorders queue items and adjusts the active index", () => {
    const first = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Second",
    });
    const third = createQueueItem({
      release: otherRelease,
      trackPosition: "B1",
      trackTitle: "Third",
    });
    const queue = [first, second, third];

    expect(
      reorderQueueItems(queue, 0, 2).map((item) => item.trackTitle),
    ).toEqual(["Second", "Third", "First"]);

    expect(
      adjustQueueIndexAfterReorder({
        queueIndex: 1,
        fromIndex: 0,
        toIndex: 2,
      }),
    ).toBe(0);

    expect(
      adjustQueueIndexAfterReorder({
        queueIndex: 1,
        fromIndex: 2,
        toIndex: 0,
      }),
    ).toBe(2);

    expect(
      adjustQueueIndexAfterReorder({
        queueIndex: 1,
        fromIndex: 1,
        toIndex: 3,
      }),
    ).toBe(3);
  });

  it("clears upcoming queue rows while keeping the active item at index zero", () => {
    const first = createQueueItem({
      release,
      trackPosition: "A1",
      trackTitle: "First",
    });
    const second = createQueueItem({
      release: otherRelease,
      trackPosition: "A2",
      trackTitle: "Second",
    });
    const third = createQueueItem({
      release,
      trackPosition: "B1",
      trackTitle: "Third",
    });

    expect(clearQueueKeepingActiveItem([first, second, third], 1)).toEqual({
      queue: [second],
      queueIndex: 0,
    });
  });
});
