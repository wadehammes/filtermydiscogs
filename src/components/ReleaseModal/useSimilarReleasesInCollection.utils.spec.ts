import { describe, expect, it } from "@jest/globals";
import {
  getSimilarReleasesSidebarLoading,
  isDeferredSimilarAnchorReady,
} from "src/components/ReleaseModal/useSimilarReleasesInCollection.utils";
import { releaseFactory } from "src/tests/factories/Release.factory";

describe("useSimilarReleasesInCollection.utils", () => {
  const sourceRelease = releaseFactory.withStyles(["Techno"], {
    instance_id: "source-instance",
  });
  const peerRelease = releaseFactory.withStyles(["House"], {
    instance_id: "peer-instance",
  });

  it("isDeferredSimilarAnchorReady is false while the collection is loading", () => {
    expect(
      isDeferredSimilarAnchorReady("source-instance", sourceRelease, true),
    ).toBe(false);
  });

  it("getSimilarReleasesSidebarLoading is true while collection or deferred inputs lag", () => {
    const collection = [sourceRelease, peerRelease];
    const base = {
      enabled: true,
      release: sourceRelease,
      canHaveSimilar: true,
      isCollectionLoading: false,
      similarSourceKey: "source-instance",
      deferredSimilarSourceKey: "source-instance",
      releasesForSimilar: collection,
      allReleases: collection,
      similarModalPool: null,
    };

    expect(getSimilarReleasesSidebarLoading(base)).toBe(false);
    expect(
      getSimilarReleasesSidebarLoading({
        ...base,
        isCollectionLoading: true,
      }),
    ).toBe(true);
    expect(
      getSimilarReleasesSidebarLoading({
        ...base,
        deferredSimilarSourceKey: "previous-instance",
      }),
    ).toBe(true);
    expect(
      getSimilarReleasesSidebarLoading({
        ...base,
        releasesForSimilar: [sourceRelease],
        allReleases: collection,
      }),
    ).toBe(true);
  });

  it("getSimilarReleasesSidebarLoading is false when the modal pool is already settled", () => {
    const collection = [sourceRelease, peerRelease];

    expect(
      getSimilarReleasesSidebarLoading({
        enabled: true,
        release: sourceRelease,
        canHaveSimilar: true,
        isCollectionLoading: false,
        similarSourceKey: "source-instance",
        deferredSimilarSourceKey: "source-instance",
        releasesForSimilar: [sourceRelease],
        allReleases: collection,
        similarModalPool: {
          fullPool: collection,
          pageCount: 1,
          totalMatchCount: 1,
        },
      }),
    ).toBe(false);
  });
});
