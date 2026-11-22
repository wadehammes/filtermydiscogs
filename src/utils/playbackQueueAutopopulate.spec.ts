import { describe, expect, it } from "@jest/globals";
import {
  queueHasCollectionRadioTailItems,
  queueHasSimilarTailItems,
  resolvePlaybackQueueAutopopulateSource,
  resolvePlaybackQueueDrawerStatusMessage,
  shouldSuppressSimilarQueueTailForCollectionRadio,
} from "./playbackQueueAutopopulate";

describe("playbackQueueAutopopulate", () => {
  it("prioritizes collection radio over similar tail", () => {
    expect(
      resolvePlaybackQueueAutopopulateSource({
        collectionRadioActive: true,
        isCollectionRadioQueueLoading: false,
        isSimilarQueueLoading: true,
        queueHasSimilarTailItems: true,
        queueHasCollectionRadioTailItems: false,
      }),
    ).toBe("collection-radio");
  });

  it("resolves collection radio from queue markers when the session atom is cleared", () => {
    expect(
      resolvePlaybackQueueAutopopulateSource({
        collectionRadioActive: false,
        isCollectionRadioQueueLoading: false,
        isSimilarQueueLoading: false,
        queueHasSimilarTailItems: false,
        queueHasCollectionRadioTailItems: true,
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
        queueHasCollectionRadioTailItems: false,
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

  it("returns the loading message for similar tail autopopulate", () => {
    expect(
      resolvePlaybackQueueDrawerStatusMessage({
        isAlbumQueueBuilding: false,
        isSimilarQueueLoading: true,
        isCollectionRadioQueueLoading: false,
        autopopulateSource: "similar-tail",
      }),
    ).toContain("Adding similar releases");
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

  it("suppresses similar tail when collection radio is active or queued rows are marked", () => {
    expect(
      shouldSuppressSimilarQueueTailForCollectionRadio({
        collectionRadioActive: true,
        upcomingQueue: [],
      }),
    ).toBe(true);
    expect(
      shouldSuppressSimilarQueueTailForCollectionRadio({
        collectionRadioActive: false,
        upcomingQueue: [{ fromCollectionRadio: true }],
      }),
    ).toBe(true);
    expect(
      shouldSuppressSimilarQueueTailForCollectionRadio({
        collectionRadioActive: false,
        upcomingQueue: [],
      }),
    ).toBe(false);
  });

  it("detects similar and collection radio tail markers on queue items", () => {
    expect(queueHasSimilarTailItems([{ fromSimilarRelease: true }])).toBe(true);
    expect(
      queueHasCollectionRadioTailItems([{ fromCollectionRadio: true }]),
    ).toBe(true);
  });
});
