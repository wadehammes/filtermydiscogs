import { describe, expect, it } from "@jest/globals";
import {
  clearAllLastPlayedPlaylistIds,
  readLastPlayedPlaylistId,
  writeLastPlayedPlaylistId,
} from "src/utils/lastPlayedPlaylistStorage";

describe("lastPlayedPlaylistStorage", () => {
  it("reads and writes the last played playlist id per user", () => {
    localStorage.clear();

    expect(readLastPlayedPlaylistId("user-a")).toBeNull();

    writeLastPlayedPlaylistId("user-a", "playlist-1");
    writeLastPlayedPlaylistId("user-b", "playlist-2");

    expect(readLastPlayedPlaylistId("user-a")).toBe("playlist-1");
    expect(readLastPlayedPlaylistId("user-b")).toBe("playlist-2");
  });

  it("clearAllLastPlayedPlaylistIds removes every scoped entry", () => {
    localStorage.clear();
    writeLastPlayedPlaylistId("user-a", "playlist-1");
    writeLastPlayedPlaylistId("user-b", "playlist-2");

    clearAllLastPlayedPlaylistIds();

    expect(readLastPlayedPlaylistId("user-a")).toBeNull();
    expect(readLastPlayedPlaylistId("user-b")).toBeNull();
  });
});
