import { describe, expect, it } from "@jest/globals";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { resolvePublicPlaylistHeroThumbUrls } from "src/utils/publicPlaylistHeroThumbUrls";

describe("resolvePublicPlaylistHeroThumbUrls", () => {
  it("when server mosaic urls exist, keeps them instead of rebuilding from client releases", () => {
    const tracks = [
      playlistTrackRowFactory.build({ instance_id: "9001" }),
      playlistTrackRowFactory.build({ instance_id: "9002" }),
    ];
    const releaseByInstanceId = new Map([
      [
        "9001",
        releaseFactory.build({
          instance_id: "9001",
          basic_information: {
            thumb: "https://i.discogs.com/client-only.jpg",
            cover_image: "",
            title: "Client",
            artists: [],
          },
        }),
      ],
    ]);

    expect(
      resolvePublicPlaylistHeroThumbUrls({
        mosaicThumbUrls: ["https://i.discogs.com/server-a.jpg"],
        tracks,
        releaseByInstanceId,
      }),
    ).toEqual(["https://i.discogs.com/server-a.jpg"]);
  });

  it("when server mosaic urls are empty, builds thumbs from playlist order", () => {
    const tracks = [playlistTrackRowFactory.build({ instance_id: "9001" })];
    const release = releaseFactory.build({
      instance_id: "9001",
      basic_information: {
        thumb: "https://i.discogs.com/from-release.jpg",
        cover_image: "",
        title: "Album",
        artists: [],
      },
    });

    expect(
      resolvePublicPlaylistHeroThumbUrls({
        mosaicThumbUrls: [],
        tracks,
        releaseByInstanceId: new Map([["9001", release]]),
      }),
    ).toEqual(["https://i.discogs.com/from-release.jpg"]);
  });
});
