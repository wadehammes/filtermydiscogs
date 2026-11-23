import { describe, expect, it } from "@jest/globals";
import { PLAYLIST_TRACK_VOTE_UP } from "src/constants/playlistTrackVote.constants";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { publicPlaylistResponseFactory } from "src/tests/factories/PublicPlaylistResponse.factory";
import type {
  PlaylistTrackRow,
  PublicPlaylistResponse,
} from "src/types/playlist.types";
import {
  mergePublicPlaylistResponsePreservingLocalVotes,
  publicPlaylistQueryDataEqualsForRender,
} from "src/utils/publicPlaylistTrackVoteQueryCache";

describe("publicPlaylistQueryDataEqualsForRender", () => {
  it("when viewer votes and ownership match, reports no render change", () => {
    const response = publicPlaylistResponseFactory.build({
      viewerIsOwner: false,
    });

    expect(
      publicPlaylistQueryDataEqualsForRender(response, {
        ...response,
        playlist: { ...response.playlist, name: "Renamed on server only" },
      }),
    ).toBe(true);
  });

  it("when viewerIsOwner differs, reports a render change", () => {
    const base = publicPlaylistResponseFactory.build({ viewerIsOwner: false });
    const next = { ...base, viewerIsOwner: true as const };

    expect(publicPlaylistQueryDataEqualsForRender(base, next)).toBe(false);
  });

  it("when SSR omits viewerIsOwner and API returns false, reports no render change", () => {
    const base = publicPlaylistResponseFactory.build({ viewerIsOwner: false });
    const { viewerIsOwner: _removed, ...ssr } = base;
    const api = base;

    expect(publicPlaylistQueryDataEqualsForRender(ssr, api)).toBe(true);
  });

  it("when SSR omits viewerVote and API returns null, reports no render change", () => {
    const track = playlistTrackRowFactory.opening({
      track_key: "9001:A1",
    });
    const base = publicPlaylistResponseFactory.build({
      tracks: [track],
    });
    const ssrTrack = { ...track };
    const apiTrack: PlaylistTrackRow = { ...track, viewerVote: null };
    const ssr: PublicPlaylistResponse = {
      ...base,
      tracks: [ssrTrack],
    };
    const api: PublicPlaylistResponse = {
      ...base,
      tracks: [apiTrack],
    };

    expect(publicPlaylistQueryDataEqualsForRender(ssr, api)).toBe(true);
  });
});

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
