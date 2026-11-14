import { describe, expect, it } from "@jest/globals";
import {
  getSimilarReleasesSidebarLoading,
  isDeferredSimilarAnchorReady,
  resolveSimilarAnchorRelease,
  resolveStableSimilarModalPool,
} from "src/components/ReleaseModal/useSimilarReleasesInCollection.utils";
import { releaseFactory } from "src/tests/factories/Release.factory";

describe("useSimilarReleasesInCollection.utils", () => {
  const sourceRelease = releaseFactory.withStyles(["Techno"], {
    instance_id: "source-instance",
  });
  const peerRelease = releaseFactory.withStyles(["House"], {
    instance_id: "peer-instance",
  });

  it("isDeferredSimilarAnchorReady is true when the deferred anchor matches the release", () => {
    expect(isDeferredSimilarAnchorReady("source-instance", sourceRelease)).toBe(
      true,
    );
    expect(isDeferredSimilarAnchorReady(null, sourceRelease)).toBe(false);
  });

  it("resolveSimilarAnchorRelease uses the current release while its anchor key is active", () => {
    expect(
      resolveSimilarAnchorRelease(
        sourceRelease,
        "source-instance",
        "previous-instance",
      ),
    ).toBe(sourceRelease);
    expect(
      resolveSimilarAnchorRelease(
        sourceRelease,
        "source-instance",
        "source-instance",
      ),
    ).toBe(sourceRelease);
    expect(
      resolveSimilarAnchorRelease(sourceRelease, null, "source-instance"),
    ).toBe(sourceRelease);
    expect(resolveSimilarAnchorRelease(sourceRelease, null, null)).toBe(null);
  });

  it("resolveStableSimilarModalPool reuses the prior pool while rescore is pending", () => {
    const pool = {
      fullPool: [sourceRelease, peerRelease],
      pageCount: 2,
      totalMatchCount: 2,
    };

    const settled = resolveStableSimilarModalPool({
      similarSourceKey: "source-instance",
      computedPool: pool,
      cache: null,
    });

    expect(settled.similarModalPool).toBe(pool);

    const sticky = resolveStableSimilarModalPool({
      similarSourceKey: "source-instance",
      computedPool: null,
      cache: settled.cache,
    });

    expect(sticky.similarModalPool).toBe(pool);
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
