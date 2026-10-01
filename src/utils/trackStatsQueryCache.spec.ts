import { describe, expect, it } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import type { UserTrackStatsResponse } from "src/api/endpoints/tracks";
import { TrackStatsQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  isAwaitingTrackStatsForYoutubeOverride,
  mergeTrackStatsFromQueryCache,
  patchTrackStatsInQueryCache,
  trackStatsCacheIncludesKeys,
} from "src/utils/trackStatsQueryCache";

describe("trackStatsQueryCache", () => {
  it("mergeTrackStatsFromQueryCache merges stats from all user track stats queries", () => {
    const queryClient = new QueryClient();
    const userId = 7;

    queryClient.setQueryData<UserTrackStatsResponse>(
      TrackStatsQueryKeys.byUserAndKeys(userId, "a"),
      {
        stats: {
          "inst:A1": {
            play_count: 1,
            listen_count: 0,
            youtube_id: "abc12345678",
          },
        },
      },
    );
    queryClient.setQueryData<UserTrackStatsResponse>(
      TrackStatsQueryKeys.byUserAndKeys(userId, "b"),
      {
        stats: {
          "inst:B1": { play_count: 0, listen_count: 2, youtube_id: null },
        },
      },
    );

    expect(mergeTrackStatsFromQueryCache(queryClient, userId)).toEqual({
      "inst:A1": { play_count: 1, listen_count: 0, youtube_id: "abc12345678" },
      "inst:B1": { play_count: 0, listen_count: 2, youtube_id: null },
    });
  });

  it("patchTrackStatsInQueryCache updates youtube_id on matching cached queries", () => {
    const queryClient = new QueryClient();
    const userId = 7;
    const queryKey = TrackStatsQueryKeys.byUserAndKeys(userId, "sig");

    queryClient.setQueryData<UserTrackStatsResponse>(queryKey, {
      stats: {
        "inst:A1": { play_count: 3, listen_count: 1, youtube_id: null },
      },
    });

    patchTrackStatsInQueryCache(queryClient, userId, "inst:A1", (previous) => ({
      ...previous,
      youtube_id: "dQw4w9WgXcQ",
    }));

    expect(
      queryClient.getQueryData<UserTrackStatsResponse>(queryKey)?.stats[
        "inst:A1"
      ],
    ).toEqual({
      play_count: 3,
      listen_count: 1,
      youtube_id: "dQw4w9WgXcQ",
    });
  });

  it("isAwaitingTrackStatsForYoutubeOverride is true while track stats for the active key are still pending", () => {
    expect(
      isAwaitingTrackStatsForYoutubeOverride({
        isPlaying: true,
        userId: 7,
        trackKey: "inst:A1",
        resolvedOverrideId: undefined,
        stats: {},
      }),
    ).toBe(true);
    expect(
      isAwaitingTrackStatsForYoutubeOverride({
        isPlaying: true,
        userId: 7,
        trackKey: "inst:A1",
        resolvedOverrideId: "overrid1234",
        stats: {},
      }),
    ).toBe(false);
  });

  it("trackStatsCacheIncludesKeys is true only when every key exists in stats", () => {
    expect(
      trackStatsCacheIncludesKeys(
        { "inst:A1": { play_count: 0, listen_count: 0, youtube_id: null } },
        ["inst:A1"],
      ),
    ).toBe(true);
    expect(
      trackStatsCacheIncludesKeys(
        { "inst:A1": { play_count: 0, listen_count: 0, youtube_id: null } },
        ["inst:A1", "inst:B1"],
      ),
    ).toBe(false);
  });
});
