import { describe, expect, it } from "@jest/globals";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  hasReleaseCoverImageUrl,
  resolvePlaylistTrackReleaseImageUrl,
  resolveReleaseDisplayImageUrl,
} from "src/utils/releaseAlbumCover";

describe("hasReleaseCoverImageUrl", () => {
  it("when the url is a Discogs CDN address, returns true", () => {
    expect(hasReleaseCoverImageUrl("https://i.discogs.com/123.jpg")).toBe(true);
  });

  it("when the url is an SVG data placeholder, returns false", () => {
    expect(hasReleaseCoverImageUrl("data:image/svg+xml,%3Csvg")).toBe(false);
  });

  it("when the url is empty, returns false", () => {
    expect(hasReleaseCoverImageUrl("")).toBe(false);
  });
});

describe("resolveReleaseDisplayImageUrl", () => {
  it("prefers cover_image like ReleaseCard on /collection", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://i.discogs.com/thumb.jpg",
        cover_image: "https://i.discogs.com/cover.jpg",
      },
    });

    expect(resolveReleaseDisplayImageUrl(release)).toBe(
      "https://i.discogs.com/cover.jpg",
    );
  });

  it("falls back to thumb when cover_image is missing", () => {
    const release = releaseFactory.withThumbOnly("https://i.discogs.com/b.jpg");

    expect(resolveReleaseDisplayImageUrl(release)).toBe(
      "https://i.discogs.com/b.jpg",
    );
  });
});

describe("resolvePlaylistTrackReleaseImageUrl", () => {
  it("uses Discogs art and never YouTube thumbnails", () => {
    const release = releaseFactory.withThumbOnly("https://i.discogs.com/b.jpg");
    const track = playlistTrackRowFactory.opening({ youtube_id: "abc123xyz" });

    expect(resolvePlaylistTrackReleaseImageUrl(release)).toBe(
      "https://i.discogs.com/b.jpg",
    );
    expect(track.youtube_id).toBe("abc123xyz");
  });

  it("returns empty when release art is unavailable", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "",
        cover_image: "",
      },
    });

    expect(resolvePlaylistTrackReleaseImageUrl(release)).toBe("");
  });
});
