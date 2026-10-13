import { describe, expect, it } from "@jest/globals";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { labelFactory } from "src/tests/factories/Label.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsBasicInformation } from "src/types";
import { getSimilarReleases } from "src/utils/similarReleases";

describe("getSimilarReleases", () => {
  const sourceArtist = artistFactory.build({ name: "Source Artist" });
  const sourceLabel = labelFactory.build({ name: "Source Label" });

  const buildSourceLikeBasicInformation = (
    overrides: Partial<DiscogsBasicInformation> = {},
  ) =>
    basicInformationFactory.build({
      styles: ["Techno", "Ambient"],
      genres: ["Electronic"],
      master_id: 100,
      title: "Source Album",
      year: 2018,
      artists: [sourceArtist],
      labels: [sourceLabel],
      ...overrides,
    });

  const sourceRelease = releaseFactory.build({
    instance_id: "source-instance",
    basic_information: buildSourceLikeBasicInformation(),
  });

  it("returns releases that share genre or style tags", () => {
    const similarRelease = releaseFactory.withStyles(["Techno", "House"], {
      instance_id: "similar-instance",
      basic_information: {
        master_id: 200,
        title: "Similar Album",
      },
    });
    const unrelatedRelease = releaseFactory.withStyles(["Country"], {
      instance_id: "unrelated-instance",
      basic_information: {
        master_id: 300,
        title: "Unrelated Album",
      },
    });

    const results = getSimilarReleases({
      releases: [sourceRelease, similarRelease, unrelatedRelease],
      sourceRelease,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("similar-instance");
  });

  it("excludes the source release and same-master pressings", () => {
    const sameMasterRelease = releaseFactory.withStyles(["Techno"], {
      instance_id: "same-master-instance",
      basic_information: {
        master_id: 100,
        title: "Repress",
      },
    });

    const results = getSimilarReleases({
      releases: [sourceRelease, sameMasterRelease],
      sourceRelease,
    });

    expect(results).toHaveLength(0);
  });

  it("excludes releases already represented in the queue", () => {
    const queuedRelease = releaseFactory.withStyles(["Techno"], {
      instance_id: "queued-instance",
      basic_information: {
        master_id: 201,
        title: "Queued Album",
      },
    });
    const freshRelease = releaseFactory.withStyles(["Ambient"], {
      instance_id: "fresh-instance",
      basic_information: {
        master_id: 202,
        title: "Fresh Album",
      },
    });

    const results = getSimilarReleases({
      releases: [sourceRelease, queuedRelease, freshRelease],
      sourceRelease,
      excludeInstanceIds: new Set(["queued-instance"]),
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("fresh-instance");
  });

  it("prefers style overlap over genre-only overlap", () => {
    const styleMatch = releaseFactory.withStyles(["Techno", "Ambient"], {
      instance_id: "style-match",
      basic_information: {
        genres: ["Pop"],
        master_id: 201,
        title: "Style Match",
      },
    });
    const genreOnlyMatch = releaseFactory.withStyles(["House"], {
      instance_id: "genre-only-match",
      basic_information: {
        genres: ["Electronic"],
        master_id: 202,
        title: "Genre Only Match",
      },
    });

    const results = getSimilarReleases({
      releases: [sourceRelease, genreOnlyMatch, styleMatch],
      sourceRelease,
      limit: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("style-match");
  });

  it("matches compound style tags split on non-alphanumeric characters", () => {
    const italoDiscoRelease = releaseFactory.withStyles(["Italo-Disco"], {
      instance_id: "italo-source",
      basic_information: {
        genres: ["Electronic"],
        master_id: 301,
        title: "Top Model",
      },
    });
    const discoRelease = releaseFactory.withStyles(["Disco"], {
      instance_id: "disco-match",
      basic_information: {
        genres: ["Electronic"],
        master_id: 302,
        title: "Disco Match",
      },
    });
    const unrelatedRelease = releaseFactory.withStyles(["Deep House"], {
      instance_id: "unrelated-house",
      basic_information: {
        genres: ["Electronic"],
        master_id: 303,
        title: "House Only",
      },
    });

    const results = getSimilarReleases({
      releases: [italoDiscoRelease, discoRelease, unrelatedRelease],
      sourceRelease: italoDiscoRelease,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("disco-match");
  });

  it("matches space-separated style tags to shorter style names", () => {
    const garageHouseRelease = releaseFactory.withStyles(["Garage House"], {
      instance_id: "garage-house-source",
      basic_information: {
        genres: ["Electronic"],
        master_id: 311,
        title: "Garage Source",
      },
    });
    const houseRelease = releaseFactory.withStyles(["House"], {
      instance_id: "house-match",
      basic_information: {
        genres: ["Electronic"],
        master_id: 312,
        title: "House Match",
      },
    });
    const technoRelease = releaseFactory.withStyles(["Techno"], {
      instance_id: "techno-only",
      basic_information: {
        genres: ["Electronic"],
        master_id: 313,
        title: "Techno Only",
      },
    });

    const results = getSimilarReleases({
      releases: [garageHouseRelease, houseRelease, technoRelease],
      sourceRelease: garageHouseRelease,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("house-match");
  });

  it("allows multiple releases from the same primary artist when release ids differ", () => {
    const sharedArtistMatch = releaseFactory.withStyles(["Techno"], {
      instance_id: "shared-artist-match",
      basic_information: {
        id: 203,
        master_id: 203,
        title: "Shared Artist Match",
        artists: [sourceArtist],
      },
    });
    const secondSharedArtistMatch = releaseFactory.withStyles(
      ["Techno", "Ambient"],
      {
        instance_id: "second-shared-artist-match",
        basic_information: {
          id: 204,
          master_id: 204,
          title: "Second Shared Artist Match",
          artists: [sourceArtist],
        },
      },
    );
    const tagOnlyMatch = releaseFactory.withStyles(["Techno"], {
      instance_id: "tag-only-match",
      basic_information: {
        id: 205,
        master_id: 205,
        title: "Tag Only Match",
        artists: [artistFactory.build({ name: "Other Artist" })],
      },
    });

    const results = getSimilarReleases({
      releases: [
        sourceRelease,
        sharedArtistMatch,
        secondSharedArtistMatch,
        tagOnlyMatch,
      ],
      sourceRelease,
      limit: 3,
    });

    expect(results).toHaveLength(3);
    expect(results.map((release) => release.instance_id)).toEqual([
      "second-shared-artist-match",
      "tag-only-match",
      "shared-artist-match",
    ]);
  });

  it("keeps only one match per discogs release id", () => {
    const duplicateReleaseA = releaseFactory.withStyles(["Techno"], {
      instance_id: "duplicate-release-a",
      basic_information: {
        id: 9001,
        master_id: 301,
        title: "Duplicate Album",
      },
    });
    const duplicateReleaseB = releaseFactory.withStyles(["Techno", "House"], {
      instance_id: "duplicate-release-b",
      basic_information: {
        id: 9001,
        master_id: 301,
        title: "Duplicate Album",
      },
    });

    const results = getSimilarReleases({
      releases: [sourceRelease, duplicateReleaseB, duplicateReleaseA],
      sourceRelease,
      limit: 2,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("duplicate-release-a");
  });

  it("excludes other collection copies of the source release id", () => {
    const sourceCopy = releaseFactory.build({
      instance_id: "source-copy",
      basic_information: buildSourceLikeBasicInformation({ id: 5001 }),
    });
    const openSource = releaseFactory.build({
      instance_id: "open-source",
      basic_information: buildSourceLikeBasicInformation({ id: 5001 }),
    });
    const similarRelease = releaseFactory.withStyles(["Techno", "House"], {
      instance_id: "similar-instance",
      basic_information: {
        id: 5002,
        master_id: 200,
        title: "Similar Album",
      },
    });

    const results = getSimilarReleases({
      releases: [openSource, sourceCopy, similarRelease],
      sourceRelease: openSource,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("similar-instance");
  });

  it("keeps only one match per master id", () => {
    const duplicateMasterRelease = releaseFactory.withStyles(["Techno"], {
      instance_id: "duplicate-master-a",
      basic_information: {
        master_id: 301,
        title: "Duplicate Master A",
      },
    });
    const duplicateMasterCopy = releaseFactory.withStyles(["Techno", "House"], {
      instance_id: "duplicate-master-b",
      basic_information: {
        master_id: 301,
        title: "Duplicate Master B",
      },
    });

    const results = getSimilarReleases({
      releases: [sourceRelease, duplicateMasterCopy, duplicateMasterRelease],
      sourceRelease,
      limit: 2,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("duplicate-master-a");
  });

  it("returns empty when the source has no genre or style tags", () => {
    const untaggedArtist = artistFactory.build({ name: "Untagged Artist" });
    const untaggedBasicInformation = basicInformationFactory.build({
      styles: [],
      genres: [],
      master_id: 205,
      title: "Same Artist Album",
      artists: [untaggedArtist],
    });
    const sameArtistRelease = releaseFactory.build({
      instance_id: "same-artist",
      basic_information: untaggedBasicInformation,
    });
    const untaggedSource = releaseFactory.build({
      instance_id: "untagged-source",
      basic_information: basicInformationFactory.build({
        styles: [],
        genres: [],
        master_id: 207,
        title: "Untagged Source",
        artists: [untaggedArtist],
      }),
    });

    const results = getSimilarReleases({
      releases: [untaggedSource, sameArtistRelease],
      sourceRelease: untaggedSource,
    });

    expect(results).toEqual([]);
  });

  it("applies the same-artist penalty when artist ids match despite different names", () => {
    const sharedArtistById = releaseFactory.withStyles(["Techno"], {
      instance_id: "shared-artist-by-id",
      basic_information: {
        master_id: 401,
        title: "Alias Release",
        year: 2018,
        artists: [artistFactory.build({ id: 42, name: "AFX" })],
      },
    });
    const otherArtistMatch = releaseFactory.withStyles(["Techno"], {
      instance_id: "other-artist-match",
      basic_information: {
        master_id: 402,
        title: "Other Artist Release",
        year: 2018,
        artists: [artistFactory.build({ id: 99, name: "Other Artist" })],
      },
    });
    const sourceWithArtistId = releaseFactory.build({
      instance_id: "source-with-artist-id",
      basic_information: buildSourceLikeBasicInformation({
        artists: [artistFactory.build({ id: 42, name: "Aphex Twin" })],
      }),
    });

    const results = getSimilarReleases({
      releases: [sourceWithArtistId, sharedArtistById, otherArtistMatch],
      sourceRelease: sourceWithArtistId,
      limit: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("other-artist-match");
  });

  it("prefers shared label id matches when tag overlap is equal", () => {
    const sharedLabelById = releaseFactory.withStyles(["Techno"], {
      instance_id: "shared-label-by-id",
      basic_information: {
        master_id: 501,
        title: "Same Label Release",
        year: 2018,
        labels: [labelFactory.build({ id: 10, name: "Warp" })],
      },
    });
    const otherLabelMatch = releaseFactory.withStyles(["Techno"], {
      instance_id: "other-label-match",
      basic_information: {
        master_id: 502,
        title: "Other Label Release",
        year: 2018,
        labels: [labelFactory.build({ id: 20, name: "Other Label" })],
      },
    });
    const sourceWithLabelId = releaseFactory.build({
      instance_id: "source-with-label-id",
      basic_information: buildSourceLikeBasicInformation({
        labels: [labelFactory.build({ id: 10, name: "Warp Records" })],
      }),
    });

    const results = getSimilarReleases({
      releases: [sourceWithLabelId, otherLabelMatch, sharedLabelById],
      sourceRelease: sourceWithLabelId,
      limit: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("shared-label-by-id");
  });

  it("sorts by overlap score and respects the limit", () => {
    const strongMatch = releaseFactory.withStyles(["Techno", "Ambient"], {
      instance_id: "strong-match",
      basic_information: {
        master_id: 201,
        title: "Strong Match",
      },
    });
    const weakMatch = releaseFactory.withStyles(["Techno", "House", "Dub"], {
      instance_id: "weak-match",
      basic_information: {
        master_id: 202,
        title: "Weak Match",
      },
    });

    const results = getSimilarReleases({
      releases: [sourceRelease, weakMatch, strongMatch],
      sourceRelease,
      limit: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("strong-match");
  });
});
