import {
  PLAYLIST_TRACK_VOTE_DOWN,
  PLAYLIST_TRACK_VOTE_UP,
} from "src/constants/playlistTrackVote.constants";
import {
  computePlaylistTrackVoteCountIncrements,
  computePlaylistTrackVoteOptimisticState,
  formatPlaylistTrackVoteCountLabel,
  isHotPlaylistTrack,
  playlistTrackNetVoteScore,
  resolvePlaylistTrackVoteToggle,
} from "src/utils/playlistTrackVote";

describe("playlistTrackVote utils", () => {
  it("computes net vote score", () => {
    expect(playlistTrackNetVoteScore({ upCount: 5, downCount: 2 })).toBe(3);
  });

  it("marks a track hot when up count and net score meet thresholds", () => {
    expect(isHotPlaylistTrack({ upCount: 3, downCount: 0 })).toBe(true);
    expect(isHotPlaylistTrack({ upCount: 3, downCount: 2 })).toBe(false);
    expect(isHotPlaylistTrack({ upCount: 2, downCount: 0 })).toBe(false);
  });

  it("formats a positive net count for the drawer badge", () => {
    expect(
      formatPlaylistTrackVoteCountLabel({ upCount: 4, downCount: 1 }),
    ).toBe("3");
    expect(
      formatPlaylistTrackVoteCountLabel({ upCount: 1, downCount: 2 }),
    ).toBeNull();
  });

  it("clears a vote when the same direction is requested again", () => {
    expect(
      resolvePlaylistTrackVoteToggle(
        PLAYLIST_TRACK_VOTE_UP,
        PLAYLIST_TRACK_VOTE_UP,
      ),
    ).toBeNull();
    expect(
      resolvePlaylistTrackVoteToggle(
        PLAYLIST_TRACK_VOTE_DOWN,
        PLAYLIST_TRACK_VOTE_UP,
      ),
    ).toBe(PLAYLIST_TRACK_VOTE_DOWN);
  });

  it("clears an up vote when the cached row omitted viewerVote", () => {
    expect(
      computePlaylistTrackVoteOptimisticState(
        { upCount: 1, downCount: 0, viewerVote: PLAYLIST_TRACK_VOTE_UP },
        PLAYLIST_TRACK_VOTE_UP,
      ),
    ).toEqual({ upCount: 0, downCount: 0, viewerVote: null });
  });

  it("computes prisma increment deltas from a requested vote", () => {
    expect(
      computePlaylistTrackVoteCountIncrements(
        { upCount: 3, downCount: 1, viewerVote: PLAYLIST_TRACK_VOTE_UP },
        PLAYLIST_TRACK_VOTE_DOWN,
      ),
    ).toEqual({ upIncrement: -1, downIncrement: 1 });
  });

  it("computes optimistic vote counts and viewer selection", () => {
    expect(
      computePlaylistTrackVoteOptimisticState(
        { upCount: 0, downCount: 0, viewerVote: null },
        PLAYLIST_TRACK_VOTE_UP,
      ),
    ).toEqual({ upCount: 1, downCount: 0, viewerVote: PLAYLIST_TRACK_VOTE_UP });

    expect(
      computePlaylistTrackVoteOptimisticState(
        { upCount: 2, downCount: 0, viewerVote: PLAYLIST_TRACK_VOTE_UP },
        PLAYLIST_TRACK_VOTE_UP,
      ),
    ).toEqual({ upCount: 1, downCount: 0, viewerVote: null });

    expect(
      computePlaylistTrackVoteOptimisticState(
        { upCount: 3, downCount: 1, viewerVote: PLAYLIST_TRACK_VOTE_UP },
        PLAYLIST_TRACK_VOTE_DOWN,
      ),
    ).toEqual({
      upCount: 2,
      downCount: 2,
      viewerVote: PLAYLIST_TRACK_VOTE_DOWN,
    });
  });
});
