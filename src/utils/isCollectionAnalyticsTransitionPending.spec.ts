import { describe, expect, it } from "@jest/globals";
import { COLLECTION_LARGE_MIN_ITEMS } from "src/constants/collection";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { isCollectionAnalyticsTransitionPending } from "src/utils/isCollectionAnalyticsTransitionPending";

describe("isCollectionAnalyticsTransitionPending", () => {
  it("is false when releases and deferred share the same reference", () => {
    const releases = releaseFactory.buildList(3);

    expect(isCollectionAnalyticsTransitionPending(releases, releases)).toBe(
      false,
    );
  });

  it("is false for small collections even when references differ", () => {
    const releases = releaseFactory.buildList(10);
    const deferred = [...releases];

    expect(isCollectionAnalyticsTransitionPending(releases, deferred)).toBe(
      false,
    );
  });

  it("is true for large collections while deferred output has not caught up", () => {
    const releases = releaseFactory.buildList(COLLECTION_LARGE_MIN_ITEMS + 1);
    const deferred = releaseFactory.buildList(COLLECTION_LARGE_MIN_ITEMS + 1);

    expect(isCollectionAnalyticsTransitionPending(releases, deferred)).toBe(
      true,
    );
  });

  it("is false for large collections once deferred matches the live list", () => {
    const releases = releaseFactory.buildList(COLLECTION_LARGE_MIN_ITEMS + 1);

    expect(isCollectionAnalyticsTransitionPending(releases, releases)).toBe(
      false,
    );
  });
});
