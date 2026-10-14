import { describe, expect, it } from "@jest/globals";
import { playlistDetailFactory } from "src/tests/factories/PlaylistDetail.factory";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { applyPlaylistTrackOrder } from "src/utils/playlistTrackOrder";

describe("applyPlaylistTrackOrder", () => {
  it("reorders tracks and updates sort_order", () => {
    const first = playlistTrackRowFactory.build({
      track_key: "a",
      sort_order: 0,
    });
    const second = playlistTrackRowFactory.build({
      track_key: "b",
      sort_order: 1,
    });
    const playlist = playlistDetailFactory.build({
      tracks: [first, second],
    });

    const reordered = applyPlaylistTrackOrder(playlist, ["b", "a"]);

    expect(reordered.tracks.map((track) => track.track_key)).toEqual([
      "b",
      "a",
    ]);
    expect(reordered.tracks.map((track) => track.sort_order)).toEqual([0, 1]);
  });
});
