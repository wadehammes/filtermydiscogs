import { describe, expect, it } from "@jest/globals";
import {
  resolveSimilarReleasesPageState,
  type SimilarReleasesPageState,
} from "src/components/ReleaseModal/useSimilarReleasesPageState.utils";

describe("useSimilarReleasesPageState.utils", () => {
  const baseState: SimilarReleasesPageState = {
    anchorKey: "source-instance",
    collectionCount: 100,
    index: 1,
  };

  it("when the collection grows, keeps the current page index clamped to the page count", () => {
    expect(
      resolveSimilarReleasesPageState({
        anchorKey: "source-instance",
        collectionReleaseCount: 101,
        previous: baseState,
        pageCount: 2,
        restoredPageIndex: 0,
      }),
    ).toEqual({
      anchorKey: "source-instance",
      collectionCount: 101,
      index: 1,
    });
  });

  it("when the collection grows, resets the page index for a new anchor", () => {
    expect(
      resolveSimilarReleasesPageState({
        anchorKey: "next-instance",
        collectionReleaseCount: 101,
        previous: baseState,
        pageCount: 2,
        restoredPageIndex: 0,
      }),
    ).toEqual({
      anchorKey: "next-instance",
      collectionCount: 101,
      index: 0,
    });
  });
});
