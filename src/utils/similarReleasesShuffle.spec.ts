import { describe, expect, it } from "@jest/globals";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { getSimilarReleases } from "src/utils/similarReleases";
import {
  canShuffleSimilarReleaseBatch,
  mergeSimilarReleaseShuffleExclusions,
  planSimilarReleaseShuffle,
} from "src/utils/similarReleasesShuffle";

describe("similarReleasesShuffle", () => {
  const otherArtist = artistFactory.build({ id: 42, name: "Peer Artist" });

  const sourceRelease = releaseFactory.build({
    instance_id: "source-instance",
    basic_information: basicInformationFactory.build({
      styles: ["Techno", "Ambient"],
      genres: ["Electronic"],
      master_id: 100,
      title: "Source Album",
      year: 2018,
    }),
  });

  const buildPeer = (
    instanceId: string,
    title: string,
    masterId: number,
    releaseId: number,
  ) =>
    releaseFactory.withStyles(["Techno"], {
      instance_id: instanceId,
      basic_information: {
        id: releaseId,
        genres: ["Electronic"],
        master_id: masterId,
        title,
        year: 2018,
        artists: [otherArtist],
      },
    });

  it("merges visible instance ids into the shuffle exclusion set", () => {
    const merged = mergeSimilarReleaseShuffleExclusions(
      new Set(["already-seen"]),
      [
        buildPeer("peer-a", "Peer A", 201, 5001),
        buildPeer("peer-b", "Peer B", 202, 5002),
      ],
    );

    expect([...merged].sort()).toEqual(["already-seen", "peer-a", "peer-b"]);
  });

  it("plans the next exclusions and reorders when more peers remain", () => {
    const peers = [
      buildPeer("peer-a", "Peer A", 201, 5101),
      buildPeer("peer-b", "Peer B", 202, 5102),
      buildPeer("peer-c", "Peer C", 203, 5103),
    ];
    const allReleases = [sourceRelease, ...peers];
    const visibleBatch = getSimilarReleases({
      releases: allReleases,
      sourceRelease,
      limit: 2,
    });

    const plan = planSimilarReleaseShuffle({
      releases: allReleases,
      sourceRelease,
      limit: 2,
      excludedInstanceIds: new Set(),
      tieBreakSeed: 0,
      visibleBatch,
    });

    expect(visibleBatch).toHaveLength(2);

    for (const release of visibleBatch) {
      expect(plan.nextExcludedInstanceIds.has(release.instance_id)).toBe(true);
    }

    expect(plan.nextShuffleSeed).toBe(1);
    expect(plan.resetsExclusions).toBe(false);
    expect(plan.nextBatch.map((release) => release.instance_id)).not.toEqual(
      visibleBatch.map((release) => release.instance_id),
    );
  });

  it("wraps the exclusion set when no more similar releases remain", () => {
    const peers = [
      buildPeer("peer-a", "Peer A", 201, 5201),
      buildPeer("peer-b", "Peer B", 202, 5202),
    ];
    const allReleases = [sourceRelease, ...peers];
    const visibleBatch = getSimilarReleases({
      releases: allReleases,
      sourceRelease,
      limit: 2,
    });
    const excluded = mergeSimilarReleaseShuffleExclusions(
      new Set(),
      visibleBatch,
    );

    const plan = planSimilarReleaseShuffle({
      releases: allReleases,
      sourceRelease,
      limit: 2,
      excludedInstanceIds: excluded,
      tieBreakSeed: 1,
      visibleBatch,
    });

    expect(plan.resetsExclusions).toBe(true);
    expect(plan.nextExcludedInstanceIds.size).toBe(0);
    expect(plan.nextBatch).toHaveLength(2);
  });

  it("disables shuffle when only one similar release exists", () => {
    const singlePeer = buildPeer("peer-a", "Peer A", 201, 5301);
    const allReleases = [sourceRelease, singlePeer];
    const visibleBatch = getSimilarReleases({
      releases: allReleases,
      sourceRelease,
      limit: 2,
    });

    expect(
      canShuffleSimilarReleaseBatch({
        releases: allReleases,
        sourceRelease,
        limit: 2,
        excludedInstanceIds: new Set(),
        visibleBatch,
      }),
    ).toBe(false);
  });
});
