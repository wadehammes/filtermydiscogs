import { describe, expect, it } from "@jest/globals";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  resolvePlaylistTrackReleaseImageUrl,
  resolveReleaseDisplayImageUrl,
} from "src/utils/releaseAlbumCover";

describe("resolveReleaseDisplayImageUrl", () => {
  it("prefers cover_image like ReleaseCard on /releases", () => {
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
