import { describe, expect, it } from "@jest/globals";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import type { DiscogsReleaseDetail } from "src/types/discogs-release-detail.types";
import {
  buildPlaylistRowsFromDiscogsReleaseDetail,
  formatPublicReleaseCommunityMetaParts,
  resolvePublicReleaseCatalogNumbers,
  resolvePublicReleaseHeroDateMetaParts,
} from "src/utils/publicReleaseTracks";

describe("publicReleaseTracks", () => {
  it("when the release has labels with catnos, resolvePublicReleaseCatalogNumbers joins distinct values", () => {
    expect(
      resolvePublicReleaseCatalogNumbers({
        labels: [
          { name: "House Of Spice", catno: "HOS 014" },
          { name: "Another", catno: "HOS 014" },
          { name: "Side", catno: "SP-2" },
        ],
      }),
    ).toEqual(["HOS 014", "SP-2"]);
  });

  it("when labels omit catnos, resolvePublicReleaseCatalogNumbers returns an empty array", () => {
    expect(
      resolvePublicReleaseCatalogNumbers({
        labels: [{ name: "Unknown" }],
      }),
    ).toEqual([]);
  });

  it("when year and released form an ISO date with the same year, resolvePublicReleaseHeroDateMetaParts returns the date only", () => {
    expect(
      resolvePublicReleaseHeroDateMetaParts({
        year: 2026,
        released: "2026-09-09",
      }),
    ).toEqual(["2026-09-09"]);
  });

  it("when year matches released as a bare four-digit year, resolvePublicReleaseHeroDateMetaParts returns one segment", () => {
    expect(
      resolvePublicReleaseHeroDateMetaParts({ year: 2026, released: "2026" }),
    ).toEqual(["2026"]);
  });

  it("when released differs from the year prefix, resolvePublicReleaseHeroDateMetaParts returns both", () => {
    expect(
      resolvePublicReleaseHeroDateMetaParts({
        year: 2026,
        released: "1989-03-01",
      }),
    ).toEqual(["2026", "1989-03-01"]);
  });

  it("when community rating is present, formatPublicReleaseCommunityMetaParts includes average and count", () => {
    const parts = formatPublicReleaseCommunityMetaParts({
      community: {
        have: 10,
        want: 5,
        rating: { average: 4.25, count: 8 },
      },
    });

    expect(parts).toContain("Rated 4.3 / 5 (8)");
    expect(parts).toContain("10 have · 5 want");
  });

  it("when community has have/want only, formatPublicReleaseCommunityMetaParts omits rating", () => {
    const parts = formatPublicReleaseCommunityMetaParts({
      community: { have: 3, want: 1 },
    });

    expect(parts).toEqual(["3 have · 1 want"]);
  });

  it("when the tracklist has playable tracks, buildPlaylistRowsFromDiscogsReleaseDetail orders rows and sets keys", () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
      artists: [{ name: "Artist One" }],
      title: "Album Title",
      labels: [{ name: "Label", catno: "CAT-1" }],
      tracklist: [
        discogsTrackFactory.build({
          position: "A1",
          title: "First",
          type_: "track",
        }),
        discogsTrackFactory.build({
          position: "A2",
          title: "Second",
          type_: "track",
        }),
      ],
    }) as DiscogsReleaseDetail;

    const rows = buildPlaylistRowsFromDiscogsReleaseDetail({
      detail,
      sortOrderBase: 0,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]?.track_position).toBe("A1");
    expect(rows[0]?.track_key).toBe("249504:A1");
    expect(rows[0]?.sort_order).toBe(0);
    expect(rows[0]?.discogs_release_id).toBe(249504);
    expect(rows[0]?.artist).toBe("Artist One");
    expect(rows[0]?.release_title).toBe("Album Title");
    expect(rows[1]?.track_position).toBe("A2");
    expect(rows[1]?.sort_order).toBe(1);
  });

  it("when the tracklist is empty, buildPlaylistRowsFromDiscogsReleaseDetail returns an empty array", () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 99,
      tracklist: [],
    }) as DiscogsReleaseDetail;

    const rows = buildPlaylistRowsFromDiscogsReleaseDetail({
      detail,
      sortOrderBase: 0,
    });

    expect(rows).toEqual([]);
  });

  it("when a Discogs YouTube video matches a track, buildPlaylistRowsFromDiscogsReleaseDetail sets youtube_id from the video URI", () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 9001,
      tracklist: [
        discogsTrackFactory.build({
          position: "A1",
          title: "Never Gonna Give You Up",
          type_: "track",
        }),
      ],
      videos: [
        discogsVideoFactory.youtube({
          title: "Rick Astley - Never Gonna Give You Up",
          uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
        }),
      ],
    }) as DiscogsReleaseDetail;

    const rows = buildPlaylistRowsFromDiscogsReleaseDetail({
      detail,
      sortOrderBase: 0,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.youtube_id).toBe("te2jJncBVG4");
  });

  it("when no Discogs video matches a track, buildPlaylistRowsFromDiscogsReleaseDetail leaves youtube_id null", () => {
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 9002,
      tracklist: [
        discogsTrackFactory.build({
          position: "A1",
          title: "Track With No Matching Video",
          type_: "track",
        }),
      ],
      videos: [
        discogsVideoFactory.youtube({
          title: "Different Artist - Different Song",
          uri: "https://www.youtube.com/watch?v=abc12345678",
        }),
      ],
    }) as DiscogsReleaseDetail;

    const rows = buildPlaylistRowsFromDiscogsReleaseDetail({
      detail,
      sortOrderBase: 0,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.youtube_id).toBeNull();
  });
});
