import { describe, expect, it } from "@jest/globals";
import { playlistSummaryFactory } from "src/tests/factories/PlaylistSummary.factory";
import { resolveActivePlaylistId } from "src/utils/resolveActivePlaylistId";

describe("resolveActivePlaylistId", () => {
  it("keeps the active id when it still exists", () => {
    const playlists = [
      playlistSummaryFactory.build({ id: "a" }),
      playlistSummaryFactory.build({ id: "b" }),
    ];

    expect(
      resolveActivePlaylistId({
        playlists,
        activePlaylistId: "b",
        lastPlayedPlaylistId: "a",
      }),
    ).toBe("b");
  });

  it("falls back to the last played playlist before the first list item", () => {
    const playlists = [
      playlistSummaryFactory.build({ id: "first" }),
      playlistSummaryFactory.build({ id: "last-played" }),
    ];

    expect(
      resolveActivePlaylistId({
        playlists,
        activePlaylistId: null,
        lastPlayedPlaylistId: "last-played",
      }),
    ).toBe("last-played");
  });

  it("uses the first playlist when there is no valid active or last played id", () => {
    const playlists = [playlistSummaryFactory.build({ id: "only" })];

    expect(
      resolveActivePlaylistId({
        playlists,
        activePlaylistId: null,
        lastPlayedPlaylistId: "missing",
      }),
    ).toBe("only");
  });
});
