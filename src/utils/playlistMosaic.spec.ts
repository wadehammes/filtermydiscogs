import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  buildPlaylistMosaicThumbUrls,
  PLAYLIST_HERO_MOSAIC_MAX_TILES,
  uniqueInstanceIdsInPlaylistOrder,
} from "src/utils/playlistMosaic";

describe("uniqueInstanceIdsInPlaylistOrder", () => {
  it("dedupes instance ids while preserving first-seen order", () => {
    const tracks = [
      playlistTrackRowFactory.build({ instance_id: "a" }),
      playlistTrackRowFactory.build({ instance_id: "b" }),
      playlistTrackRowFactory.build({ instance_id: "a" }),
      playlistTrackRowFactory.build({ instance_id: "c" }),
    ];

    expect(uniqueInstanceIdsInPlaylistOrder(tracks)).toEqual(["a", "b", "c"]);
  });
});

describe("buildPlaylistMosaicThumbUrls", () => {
  it("returns thumbs for unique releases in playlist order", () => {
    const releaseA = releaseFactory.build({
      instance_id: "inst-a",
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://i.discogs.com/a.jpg",
        cover_image: "https://i.discogs.com/a-cover.jpg",
      },
    });
    const releaseB = releaseFactory.build({
      instance_id: "inst-b",
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "https://i.discogs.com/b.jpg",
        cover_image: "",
      },
    });

    const tracks = [
      playlistTrackRowFactory.build({ instance_id: "inst-a" }),
      playlistTrackRowFactory.build({ instance_id: "inst-b" }),
      playlistTrackRowFactory.build({ instance_id: "inst-a" }),
    ];

    const urls = buildPlaylistMosaicThumbUrls({
      tracks,
      releaseByInstanceId: new Map([
        ["inst-a", releaseA],
        ["inst-b", releaseB],
      ]),
    });

    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe("https://i.discogs.com/a-cover.jpg");
    expect(urls[1]).toBe("https://i.discogs.com/b.jpg");
  });

  it("omits mosaic tiles when release art is missing", () => {
    const release = releaseFactory.build({
      instance_id: "inst-yt",
      basic_information: {
        ...releaseFactory.build().basic_information,
        thumb: "",
        cover_image: "",
      },
    });
    const track = playlistTrackRowFactory.build({
      instance_id: "inst-yt",
      youtube_id: "abc123xyz",
    });

    const urls = buildPlaylistMosaicThumbUrls({
      tracks: [track],
      releaseByInstanceId: new Map([["inst-yt", release]]),
    });

    expect(urls).toEqual([]);
  });

  it("when maxTiles is PLAYLIST_HERO_MOSAIC_MAX_TILES, returns only the first four unique releases", () => {
    const releases = releaseFactory.buildList(5).map((release, index) =>
      releaseFactory.build({
        instance_id: `inst-${index}`,
        basic_information: {
          ...release.basic_information,
          thumb: `https://i.discogs.com/${index}.jpg`,
          cover_image: "",
        },
      }),
    );
    const tracks = releases.map((release, index) =>
      playlistTrackRowFactory.build({
        instance_id: String(release.instance_id),
        sort_order: (index + 1) * 10,
      }),
    );
    const releaseByInstanceId = new Map(
      releases.map((release) => [String(release.instance_id), release]),
    );

    const urls = buildPlaylistMosaicThumbUrls({
      tracks,
      releaseByInstanceId,
      maxTiles: PLAYLIST_HERO_MOSAIC_MAX_TILES,
    });

    expect(PLAYLIST_HERO_MOSAIC_MAX_TILES).toBe(4);
    expect(urls).toHaveLength(4);
    expect(urls).toEqual([
      "https://i.discogs.com/0.jpg",
      "https://i.discogs.com/1.jpg",
      "https://i.discogs.com/2.jpg",
      "https://i.discogs.com/3.jpg",
    ]);
  });
});
