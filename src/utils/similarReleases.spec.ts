import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { getSimilarReleases } from "src/utils/similarReleases";

describe("getSimilarReleases", () => {
  const sourceRelease = releaseFactory.build({
    instance_id: "source-instance",
    basic_information: {
      ...releaseFactory.withStyles(["Techno", "Ambient"]).basic_information,
      genres: ["Electronic"],
      master_id: 100,
      title: "Source Album",
      year: 2018,
      artists: [{ name: "Source Artist" }],
      labels: [{ name: "Source Label" }],
    },
  });

  it("returns releases that share genre or style tags", () => {
    const similarRelease = releaseFactory.build({
      instance_id: "similar-instance",
      basic_information: {
        ...releaseFactory.withStyles(["Techno", "House"]).basic_information,
        master_id: 200,
        title: "Similar Album",
      },
    });
    const unrelatedRelease = releaseFactory.build({
      instance_id: "unrelated-instance",
      basic_information: {
        ...releaseFactory.withStyles(["Country"]).basic_information,
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
    const sameMasterRelease = releaseFactory.build({
      instance_id: "same-master-instance",
      basic_information: {
        ...releaseFactory.withStyles(["Techno"]).basic_information,
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

  it("prefers style overlap over genre-only overlap", () => {
    const styleMatch = releaseFactory.build({
      instance_id: "style-match",
      basic_information: {
        ...releaseFactory.withStyles(["Techno", "Ambient"]).basic_information,
        genres: ["Pop"],
        master_id: 201,
        title: "Style Match",
      },
    });
    const genreOnlyMatch = releaseFactory.build({
      instance_id: "genre-only-match",
      basic_information: {
        ...releaseFactory.withStyles(["House"]).basic_information,
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

  it("deranks tag matches from the same artist for gig-list variety", () => {
    const sharedArtistMatch = releaseFactory.build({
      instance_id: "shared-artist-match",
      basic_information: {
        ...releaseFactory.withStyles(["Techno"]).basic_information,
        master_id: 203,
        title: "Shared Artist Match",
        artists: [{ name: "Source Artist" }],
      },
    });
    const tagOnlyMatch = releaseFactory.build({
      instance_id: "tag-only-match",
      basic_information: {
        ...releaseFactory.withStyles(["Techno"]).basic_information,
        master_id: 204,
        title: "Tag Only Match",
        artists: [{ name: "Other Artist" }],
      },
    });

    const results = getSimilarReleases({
      releases: [sourceRelease, sharedArtistMatch, tagOnlyMatch],
      sourceRelease,
      limit: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.instance_id).toBe("tag-only-match");
  });

  it("returns empty when the source has no genre or style tags", () => {
    const sameArtistRelease = releaseFactory.build({
      instance_id: "same-artist",
      basic_information: {
        ...releaseFactory.build().basic_information,
        styles: [],
        genres: [],
        master_id: 205,
        title: "Same Artist Album",
        artists: [{ name: "Untagged Artist" }],
      },
    });
    const untaggedSource = releaseFactory.build({
      instance_id: "untagged-source",
      basic_information: {
        ...sameArtistRelease.basic_information,
        master_id: 207,
        title: "Untagged Source",
        artists: [{ name: "Untagged Artist" }],
      },
    });

    const results = getSimilarReleases({
      releases: [untaggedSource, sameArtistRelease],
      sourceRelease: untaggedSource,
    });

    expect(results).toEqual([]);
  });

  it("sorts by overlap score and respects the limit", () => {
    const strongMatch = releaseFactory.build({
      instance_id: "strong-match",
      basic_information: {
        ...releaseFactory.withStyles(["Techno", "Ambient"]).basic_information,
        master_id: 201,
        title: "Strong Match",
      },
    });
    const weakMatch = releaseFactory.build({
      instance_id: "weak-match",
      basic_information: {
        ...releaseFactory.withStyles(["Techno", "House", "Dub"])
          .basic_information,
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
