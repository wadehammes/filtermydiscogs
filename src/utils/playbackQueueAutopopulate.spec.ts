import { describe, expect, it } from "@jest/globals";
import {
  queueHasCollectionRadioTailItems,
  queueHasSimilarTailItems,
  resolvePlaybackQueueAutopopulateSource,
  resolvePlaybackQueueDrawerStatusMessage,
} from "./playbackQueueAutopopulate";

describe("playbackQueueAutopopulate", () => {
  it("prioritizes collection radio over similar tail", () => {
    expect(
      resolvePlaybackQueueAutopopulateSource({
        collectionRadioActive: true,
        isCollectionRadioQueueLoading: false,
        isSimilarQueueLoading: true,
        queueHasSimilarTailItems: true,
      }),
    ).toBe("collection-radio");
  });

  it("resolves similar tail when similar items are queued", () => {
    expect(
      resolvePlaybackQueueAutopopulateSource({
        collectionRadioActive: false,
        isCollectionRadioQueueLoading: false,
        isSimilarQueueLoading: false,
        queueHasSimilarTailItems: true,
      }),
    ).toBe("similar-tail");
  });

  it("returns the loading message for collection radio", () => {
    expect(
      resolvePlaybackQueueDrawerStatusMessage({
        isAlbumQueueBuilding: true,
        isSimilarQueueLoading: false,
        isCollectionRadioQueueLoading: true,
        autopopulateSource: "collection-radio",
      }),
    ).toContain("Collection radio is adding");
  });

  it("returns the passive similar tail message", () => {
    expect(
      resolvePlaybackQueueDrawerStatusMessage({
        isAlbumQueueBuilding: false,
        isSimilarQueueLoading: false,
        isCollectionRadioQueueLoading: false,
        autopopulateSource: "similar-tail",
      }),
    ).toContain("Similar releases");
  });

  it("detects similar and collection radio tail markers on queue items", () => {
    expect(queueHasSimilarTailItems([{ fromSimilarRelease: true }])).toBe(true);
    expect(
      queueHasCollectionRadioTailItems([{ fromCollectionRadio: true }]),
    ).toBe(true);
  });
});
