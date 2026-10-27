import { afterEach, describe, expect, it } from "@jest/globals";
import {
  hasRecentPublicPlaylistViewRecord,
  markPublicPlaylistViewRecordedInClient,
} from "src/utils/publicPlaylistViewDedupe.client";

const PLAYLIST_ID = "11111111-2222-3333-4444-555555555555";

describe("publicPlaylistViewDedupe.client", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("treats a playlist as recently viewed after marking the client record", () => {
    expect(hasRecentPublicPlaylistViewRecord(PLAYLIST_ID)).toBe(false);

    markPublicPlaylistViewRecordedInClient(PLAYLIST_ID);

    expect(hasRecentPublicPlaylistViewRecord(PLAYLIST_ID)).toBe(true);
  });
});
