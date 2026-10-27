import { describe, expect, it } from "@jest/globals";
import { playlistDetailFactory } from "src/tests/factories/PlaylistDetail.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import {
  buildPlaylistDrawerStatsFromDetail,
  listPlaylistDrawerStatEntriesFromDetail,
} from "src/utils/playlistDrawerStats";

describe("playlistDrawerStats", () => {
  it("aggregates public engagement and listener votes", () => {
    const playlist = playlistDetailFactory.withTracks(
      [
        playlistTrackRowFactory.opening({ upCount: 2, downCount: 1 }),
        playlistTrackRowFactory.opening({
          track_key: "9001:A2",
          upCount: 1,
          downCount: 0,
        }),
      ],
      {
        private: false,
        publicViewCount: 10,
        publicPlayCount: 3,
      },
    );

    expect(buildPlaylistDrawerStatsFromDetail(playlist)).toEqual({
      isPublic: true,
      publicViewCount: 10,
      publicPlayCount: 3,
      totalUpVotes: 3,
      totalDownVotes: 1,
    });
  });

  it("lists public engagement and vote stats for public playlists", () => {
    const playlist = playlistDetailFactory.withTracks([], {
      private: false,
      publicViewCount: 4,
      publicPlayCount: 0,
    });

    expect(listPlaylistDrawerStatEntriesFromDetail(playlist)).toEqual([
      { id: "views", label: "Views", value: "4" },
      { id: "plays", label: "Plays", value: "0" },
      { id: "upvotes", label: "Upvotes", value: "0" },
      { id: "downvotes", label: "Downvotes", value: "0" },
    ]);
  });

  it("omits public stats for private playlists with no votes", () => {
    expect(
      listPlaylistDrawerStatEntriesFromDetail(
        playlistDetailFactory.build({ private: true, tracks: [] }),
      ),
    ).toEqual([]);
  });

  it("lists vote totals for private playlists when listeners voted", () => {
    expect(
      listPlaylistDrawerStatEntriesFromDetail(
        playlistDetailFactory.withTracks(
          [playlistTrackRowFactory.opening({ upCount: 1, downCount: 0 })],
          { private: true },
        ),
      ),
    ).toEqual([
      { id: "upvotes", label: "Upvotes", value: "1" },
      { id: "downvotes", label: "Downvotes", value: "0" },
    ]);
  });
});
