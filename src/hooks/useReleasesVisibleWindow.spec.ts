import { describe, expect, it } from "@jest/globals";
import { sliceVisibleReleases } from "src/hooks/useReleasesVisibleWindow.hook";

describe("sliceVisibleReleases", () => {
  const releases = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

  it("caps grid releases to the visible window when not searching", () => {
    expect(
      sliceVisibleReleases(releases, 2, false, false, [{ id: 99 }]),
    ).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it("uses deferred releases while search is in flight", () => {
    const deferred = [{ id: 10 }, { id: 11 }];

    expect(sliceVisibleReleases(releases, 99, false, true, deferred)).toEqual(
      deferred,
    );
  });

  it("returns the full random-mode list without slicing", () => {
    expect(
      sliceVisibleReleases(releases, 2, true, false, [{ id: 99 }]),
    ).toEqual(releases);
  });
});
