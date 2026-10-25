import { describe, expect, it } from "@jest/globals";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import {
  buildPlaylistTrackDiscogsSearchQuery,
  resolveDiscogsReleaseIdFromSearchResponse,
} from "src/utils/playlistTrackDiscogsSearch";

describe("buildPlaylistTrackDiscogsSearchQuery", () => {
  it("combines artist and release title for Discogs search", () => {
    const track = playlistTrackRowFactory.opening({
      artist: "Janeret",
      release_title: "Gaia EP",
    });

    expect(buildPlaylistTrackDiscogsSearchQuery(track)).toBe("Janeret Gaia EP");
  });
});

describe("resolveDiscogsReleaseIdFromSearchResponse", () => {
  it("returns the first release result id", () => {
    expect(
      resolveDiscogsReleaseIdFromSearchResponse({
        pagination: {
          page: 1,
          pages: 1,
          per_page: 5,
          items: 1,
          urls: { next: "", prev: "" },
        },
        results: [
          {
            id: 123,
            type: "release",
            title: "Gaia EP",
            uri: "",
            resource_url: "",
            thumb: "",
            cover_image: "",
          },
        ],
      }),
    ).toBe(123);
  });
});
