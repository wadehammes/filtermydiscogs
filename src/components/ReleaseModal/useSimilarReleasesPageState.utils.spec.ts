import { describe, expect, it } from "@jest/globals";
import {
  resolveSimilarReleasesPageState,
  type SimilarReleasesPageState,
} from "src/components/ReleaseModal/useSimilarReleasesPageState.utils";

describe("useSimilarReleasesPageState.utils", () => {
  const baseState: SimilarReleasesPageState = {
    anchorKey: "source-instance",
    index: 1,
  };

  it("when the page count changes, clamps the current page index", () => {
    expect(
      resolveSimilarReleasesPageState({
        anchorKey: "source-instance",
        previous: { anchorKey: "source-instance", index: 3 },
        pageCount: 2,
        restoredPageIndex: 0,
      }),
    ).toEqual({
      anchorKey: "source-instance",
      index: 1,
    });
  });

  it("when the anchor changes, restores the remembered page index", () => {
    expect(
      resolveSimilarReleasesPageState({
        anchorKey: "next-instance",
        previous: baseState,
        pageCount: 2,
        restoredPageIndex: 0,
      }),
    ).toEqual({
      anchorKey: "next-instance",
      index: 0,
    });
  });
});
