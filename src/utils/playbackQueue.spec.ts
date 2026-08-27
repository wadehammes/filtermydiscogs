import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import {
  appendQueueItem,
  buildCurrentQueueItem,
  buildFullPlayableAlbumQueue,
  buildPlayableAlbumQueue,
  createPreviewQueueItem,
  createQueueItem,
  findQueueItemIndex,
  getQueueItemKey,
  isSameQueueItem,
  prependQueueItem,
  removeQueueItemAtIndex,
  reorderQueueItems,
  shuffleQueueItems,
  upcomingFromAlbumQueue,
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

  it("derives upcoming tracks from an album queue without the current row", () => {
    const albumQueue = buildPlayableAlbumQueue({
      release,
      tracks,
      videos,
      startPosition: "A1",
    });

    expect(
      upcomingFromAlbumQueue(albumQueue).map((item) => item.trackPosition),
    ).toEqual(["A2"]);
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

  it("prepends queue items for history rewind", () => {
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

    expect(prependQueueItem([second], first)).toEqual([first, second]);
  });

  it("builds the current queue item from release playback state", () => {
    const track = tracks[0];

    if (!track) {
      throw new Error("Expected fixture track");
    }

    expect(
      buildCurrentQueueItem({
        release,
        previewVideo: null,
        activeTrack: track,
      })?.trackPosition,
    ).toBe("A1");

    expect(
      buildCurrentQueueItem({
        release,
        previewVideo: videos[0] ?? null,
        activeTrack: null,
      })?.previewVideoUri,
    ).toBe("https://www.youtube.com/watch?v=abc12345678");
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

  it("reorders upcoming queue items", () => {
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
  });
});
