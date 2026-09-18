import { describe, expect, it } from "@jest/globals";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsTrack } from "src/types";
import {
  formatCommunityRatingAverage,
  formatDiscogsCreditNames,
  formatReleaseHeroMetaLine,
  formatTrackCreditsLine,
  formatTrackExtraartists,
  getCommunityRatingFromReleaseDetail,
  mergeReleaseDetailWhenRefetchedCommunityIsStale,
  normalizeDiscogsJoin,
  patchReleaseDetailCommunityForUserRatingChange,
} from "src/utils/releaseDisplay";

describe("normalizeDiscogsJoin", () => {
  it("adds spacing around bare join tokens", () => {
    expect(normalizeDiscogsJoin("&")).toBe(" & ");
    expect(normalizeDiscogsJoin("/")).toBe(" / ");
  });

  it("preserves joins that already include spacing", () => {
    expect(normalizeDiscogsJoin(" & ")).toBe(" & ");
    expect(normalizeDiscogsJoin(", ")).toBe(", ");
  });
});

describe("formatDiscogsCreditNames", () => {
  it("joins artist names with Discogs join tokens", () => {
    expect(
      formatDiscogsCreditNames([
        { name: "Politics Of Dancing", join: "&" },
        { name: "Chris Carrier" },
      ]),
    ).toBe("Politics Of Dancing & Chris Carrier");
  });

  it("joins artist names with spaced Discogs join tokens", () => {
    expect(
      formatDiscogsCreditNames([
        { name: "Artist A", join: " & " },
        { name: "Artist B" },
      ]),
    ).toBe("Artist A & Artist B");
  });

  it("prefers anv over name when present", () => {
    expect(
      formatDiscogsCreditNames([{ name: "Full Name", anv: "Alias" }]),
    ).toBe("Alias");
  });
});

describe("formatTrackExtraartists", () => {
  it("includes role text when present", () => {
    expect(
      formatTrackExtraartists([
        { name: "DJ Example", role: "Remix" },
        { name: "Producer Person", role: "Producer" },
      ]),
    ).toBe("DJ Example (Remix), Producer Person (Producer)");
  });
});

describe("formatTrackCreditsLine", () => {
  const baseTrack: DiscogsTrack = {
    position: "1",
    title: "Example Track",
    type_: "track",
  };

  it("shows track artists on Various Artists releases", () => {
    expect(
      formatTrackCreditsLine({
        track: {
          ...baseTrack,
          artists: [{ name: "Track Artist" }],
        },
        releaseArtistNames: "Various",
      }),
    ).toBe("Track Artist");
  });

  it("shows extraartists even when the main artist matches the release", () => {
    expect(
      formatTrackCreditsLine({
        track: {
          ...baseTrack,
          artists: [{ name: "Main Artist" }],
          extraartists: [{ name: "Remixer", role: "Remix" }],
        },
        releaseArtistNames: "Main Artist",
      }),
    ).toBe("Main Artist · Remixer (Remix)");
  });

  it("hides redundant track artists on single-artist releases", () => {
    expect(
      formatTrackCreditsLine({
        track: {
          ...baseTrack,
          artists: [{ name: "Main Artist" }],
        },
        releaseArtistNames: "Main Artist",
      }),
    ).toBeNull();
  });

  it("shows track artists that differ from the release artist", () => {
    expect(
      formatTrackCreditsLine({
        track: {
          ...baseTrack,
          artists: [{ name: "Guest Performer" }],
        },
        releaseArtistNames: "Main Artist",
      }),
    ).toBe("Guest Performer");
  });
});

describe("formatReleaseHeroMetaLine", () => {
  it("combines release meta with community rating separately", () => {
    const release = releaseFactory.build({
      rating: 5,
      basic_information: {
        ...releaseFactory.build().basic_information,
        labels: [{ name: "P.O.D CROSS", catno: "PODCROSS 005" }],
        year: 2019,
      },
    });

    expect(
      formatReleaseHeroMetaLine({
        release,
        communityRating: {
          average: 4.6,
          count: 14,
        },
      }),
    ).toEqual({
      text: "P.O.D CROSS · 2019 · PODCROSS 005",
      communityRating: {
        average: 4.6,
        count: 14,
      },
    });
  });
});

describe("formatCommunityRatingAverage", () => {
  it("formats the average with two decimal places to match Discogs", () => {
    expect(formatCommunityRatingAverage(3.42)).toBe("3.42");
    expect(formatCommunityRatingAverage(4.6)).toBe("4.60");
    expect(formatCommunityRatingAverage(4.19)).toBe("4.19");
  });
});

describe("getCommunityRatingFromReleaseDetail", () => {
  it("returns the community average and count when present", () => {
    expect(
      getCommunityRatingFromReleaseDetail({
        id: 1,
        uri: "https://www.discogs.com/release/1",
        title: "Example",
        community: {
          rating: {
            average: 3.42,
            count: 45,
          },
        },
      }),
    ).toEqual({
      average: 3.42,
      count: 45,
    });
  });

  it("returns null when the release has no community ratings", () => {
    expect(getCommunityRatingFromReleaseDetail(undefined)).toBeNull();
    expect(
      getCommunityRatingFromReleaseDetail({
        id: 1,
        uri: "https://www.discogs.com/release/1",
        title: "Example",
        community: {
          rating: {
            average: 0,
            count: 0,
          },
        },
      }),
    ).toBeNull();
  });
});

describe("patchReleaseDetailCommunityForUserRatingChange", () => {
  it("increments the community count when the user adds a first rating", () => {
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 1,
      community: {
        rating: {
          average: 5,
          count: 4,
        },
      },
    });

    const patched = patchReleaseDetailCommunityForUserRatingChange(
      releaseDetail,
      {
        previousUserRating: 0,
        nextUserRating: 5,
      },
    );

    expect(getCommunityRatingFromReleaseDetail(patched)).toEqual({
      average: 5,
      count: 5,
    });
  });

  it("updates the average when the user changes an existing rating", () => {
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 1,
      community: {
        rating: {
          average: 4,
          count: 2,
        },
      },
    });

    const patched = patchReleaseDetailCommunityForUserRatingChange(
      releaseDetail,
      {
        previousUserRating: 3,
        nextUserRating: 5,
      },
    );

    expect(getCommunityRatingFromReleaseDetail(patched)).toEqual({
      average: 5,
      count: 2,
    });
  });
});

describe("mergeReleaseDetailWhenRefetchedCommunityIsStale", () => {
  it("keeps optimistic community stats when the refetch count lags", () => {
    const fetched = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 1,
      community: { rating: { average: 5, count: 4 } },
    });
    const optimistic = patchReleaseDetailCommunityForUserRatingChange(fetched, {
      previousUserRating: 0,
      nextUserRating: 5,
    });

    const merged = mergeReleaseDetailWhenRefetchedCommunityIsStale(
      fetched,
      optimistic,
      5,
    );

    expect(getCommunityRatingFromReleaseDetail(merged)).toEqual({
      average: 5,
      count: 5,
    });
  });
});
