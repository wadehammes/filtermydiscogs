import { describe, expect, it } from "@jest/globals";
import { PLAYLIST_TRACK_VOTE_UP } from "src/constants/playlistTrackVote.constants";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { publicPlaylistResponseFactory } from "src/tests/factories/PublicPlaylistResponse.factory";
import { mergePublicPlaylistResponsePreservingLocalVotes } from "src/utils/publicPlaylistTrackVoteQueryCache";

describe("mergePublicPlaylistResponsePreservingLocalVotes", () => {
  it("keeps local vote fields when hydration returns stale counts", () => {
    const trackKey = "9001:A1";
    const local = publicPlaylistResponseFactory.build({
      tracks: [
        playlistTrackRowFactory.opening({
          track_key: trackKey,
          upCount: 2,
          downCount: 0,
          viewerVote: PLAYLIST_TRACK_VOTE_UP,
        }),
      ],
    });
    const server = publicPlaylistResponseFactory.build({
      tracks: [
        playlistTrackRowFactory.opening({
          track_key: trackKey,
          upCount: 1,
          downCount: 0,
          viewerVote: null,
        }),
      ],
    });

    const merged = mergePublicPlaylistResponsePreservingLocalVotes(
      local,
      server,
    );

    expect(merged.tracks[0]?.upCount).toBe(2);
    expect(merged.tracks[0]?.viewerVote).toBe(PLAYLIST_TRACK_VOTE_UP);
  });
});
