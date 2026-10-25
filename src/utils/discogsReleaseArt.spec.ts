import { describe, expect, it } from "@jest/globals";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  applyDiscogsDetailImagesToRelease,
  buildPlaylistReleaseFromDiscogsDetail,
  collectUniquePlaylistDiscogsReleaseIds,
} from "src/utils/discogsReleaseArt";

describe("collectUniquePlaylistDiscogsReleaseIds", () => {
  it("dedupes discogs_release_id across playlist tracks on the same release", () => {
    const trackA = playlistTrackRowFactory.opening({
      discogs_release_id: 249504,
      track_key: "9001:A",
      track_position: "A",
    });
    const trackB = playlistTrackRowFactory.opening({
      discogs_release_id: 249504,
      track_key: "9001:B",
      track_position: "B",
    });

    expect(
      collectUniquePlaylistDiscogsReleaseIds([trackA, trackB], new Map()),
    ).toEqual(["249504"]);
  });

  it("falls back to the crate snapshot release id when discogs_release_id is missing", () => {
    const track = playlistTrackRowFactory.opening({ discogs_release_id: null });
    const release = releaseFactory.build({
      instance_id: "9001",
      basic_information: {
        ...releaseFactory.build().basic_information,
        id: 249504,
      },
    });

    expect(
      collectUniquePlaylistDiscogsReleaseIds(
        [track],
        new Map([["9001", release]]),
      ),
    ).toEqual(["249504"]);
  });
});

describe("applyDiscogsDetailImagesToRelease", () => {
  it("fills thumb and cover_image from the Discogs release detail", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "",
        cover_image: "",
      },
    });
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
      thumb: "https://i.discogs.com/thumb.jpg",
      images: [
        {
          type: "primary",
          uri: "https://i.discogs.com/cover.jpg",
        },
      ],
    });

    const merged = applyDiscogsDetailImagesToRelease(release, detail);

    expect(merged.basic_information.cover_image).toBe(
      "https://i.discogs.com/cover.jpg",
    );
    expect(merged.basic_information.thumb).toBe(
      "https://i.discogs.com/thumb.jpg",
    );
  });
});

describe("buildPlaylistReleaseFromDiscogsDetail", () => {
  it("builds a release snapshot for a playlist track instance", () => {
    const track = playlistTrackRowFactory.opening({
      discogs_release_id: 249504,
    });
    const detail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 249504,
      title: "Gaia EP",
    });

    const release = buildPlaylistReleaseFromDiscogsDetail(detail, track);

    expect(release.instance_id).toBe("9001");
    expect(release.basic_information.id).toBe(249504);
    expect(release.basic_information.title).toBe("Test Album");
  });
});
