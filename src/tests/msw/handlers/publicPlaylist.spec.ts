import { beforeEach, describe, expect, it } from "@jest/globals";
import { LOGIN_DEMO_PUBLIC_PLAYLIST_ID } from "src/constants/publicPlaylist.constants";
import {
  buildE2eDemoPublicPlaylistResponse,
  resetE2eDemoPublicPlaylistEngagement,
} from "src/tests/msw/handlers/publicPlaylist";

describe("buildE2eDemoPublicPlaylistResponse", () => {
  beforeEach(() => {
    resetE2eDemoPublicPlaylistEngagement();
  });

  it("returns playable demo tracks with YouTube ids for public playlist E2E", () => {
    const payload = buildE2eDemoPublicPlaylistResponse();

    expect(payload.playlist.id).toBe(LOGIN_DEMO_PUBLIC_PLAYLIST_ID);
    expect(payload.tracks).toHaveLength(2);
    expect(payload.tracks.every((track) => track.youtube_id?.trim())).toBe(
      true,
    );
    expect(payload.releases).toHaveLength(2);
    expect(payload.shareStats).toEqual({
      publicViewCount: 0,
      publicPlayCount: 0,
    });
  });
});
