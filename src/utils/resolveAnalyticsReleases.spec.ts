import { describe, expect, it } from "@jest/globals";
import { COLLECTION_LARGE_MIN_ITEMS } from "src/constants/collection";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { resolveAnalyticsReleases } from "src/utils/resolveAnalyticsReleases";

describe("resolveAnalyticsReleases", () => {
  it("when the collection is empty, returns the empty list", () => {
    expect(resolveAnalyticsReleases([], [])).toEqual([]);
  });

  it("when the collection is below the large threshold, prefers deferred releases when present", () => {
    const releases = releaseFactory.buildList(50);
    const deferred = releases.slice(0, 25);

    expect(resolveAnalyticsReleases(releases, deferred)).toBe(deferred);
  });

  it("when the collection is below the large threshold and deferred is empty, uses the live releases", () => {
    const releases = releaseFactory.buildList(50);

    expect(resolveAnalyticsReleases(releases, [])).toBe(releases);
  });

  it("when the collection exceeds the large threshold, always uses deferred releases", () => {
    const releases = releaseFactory.buildList(COLLECTION_LARGE_MIN_ITEMS + 1);
    const deferred = releases.slice(0, 100);

    expect(resolveAnalyticsReleases(releases, deferred)).toBe(deferred);
  });
});
