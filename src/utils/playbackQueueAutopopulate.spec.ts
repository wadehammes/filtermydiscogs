import { describe, expect, it } from "@jest/globals";
import {
  queueHasSimilarTailItems,
  resolvePlaybackQueueAutopopulateSource,
  resolvePlaybackQueueDrawerStatusMessage,
} from "./playbackQueueAutopopulate";

describe("playbackQueueAutopopulate", () => {
  it("resolves similar-tail when similar queue is loading or tail items exist", () => {
    expect(
      resolvePlaybackQueueAutopopulateSource({
        isSimilarQueueLoading: true,
        queueHasSimilarTailItems: false,
      }),
    ).toBe("similar-tail");

    expect(
      resolvePlaybackQueueAutopopulateSource({
        isSimilarQueueLoading: false,
        queueHasSimilarTailItems: true,
      }),
    ).toBe("similar-tail");

    expect(
      resolvePlaybackQueueAutopopulateSource({
        isSimilarQueueLoading: false,
        queueHasSimilarTailItems: false,
      }),
    ).toBeNull();
  });

  it("resolves drawer status copy for similar tail and album building", () => {
    expect(
      resolvePlaybackQueueDrawerStatusMessage({
        isAlbumQueueBuilding: false,
        isSimilarQueueLoading: true,
        autopopulateSource: null,
      }),
    ).toContain("Adding similar releases");

    expect(
      resolvePlaybackQueueDrawerStatusMessage({
        isAlbumQueueBuilding: true,
        isSimilarQueueLoading: false,
        autopopulateSource: null,
      }),
    ).toContain("Finishing album tracklist");

    expect(
      resolvePlaybackQueueDrawerStatusMessage({
        isAlbumQueueBuilding: false,
        isSimilarQueueLoading: false,
        autopopulateSource: "similar-tail",
      }),
    ).toContain("Similar releases are filling");
  });

  it("detects similar tail markers on queue items", () => {
    expect(queueHasSimilarTailItems([{ fromSimilarRelease: true }])).toBe(true);
    expect(queueHasSimilarTailItems([{}])).toBe(false);
  });
});
