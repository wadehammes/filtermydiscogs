import { describe, expect, it } from "@jest/globals";
import { QueryClient } from "@tanstack/react-query";
import type { UserTrackStatsResponse } from "src/api/endpoints/tracks";
import { TrackStatsQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  buildYoutubeOverridesMapFromTrackStats,
  isAwaitingTrackStatsForYoutubeOverride,
  mergeTrackStatsFromQueryCache,
  patchTrackStatsInQueryCache,
  resolveActiveTrackHasYoutubeOverride,
  resolvePlaybackTrackYoutubeOverrides,
  resolveTrackStatsForPlaybackOverrides,
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

  it("resolveTrackStatsForPlaybackOverrides keeps merged cache rows while expanded track keys fetch", () => {
    const cachedStats = {
      "101:A1": {
        play_count: 0,
        listen_count: 0,
        youtube_id: "overrid1234",
      },
    };

    expect(
      resolveTrackStatsForPlaybackOverrides({
        cacheSatisfiesKeys: false,
        cachedStats,
        fetchedStats: undefined,
      }),
    ).toEqual(cachedStats);
  });

  it("resolveTrackStatsForPlaybackOverrides prefers fetched stats once the expanded batch returns", () => {
    const cachedStats = {
      "101:A1": {
        play_count: 0,
        listen_count: 0,
        youtube_id: "overrid1234",
      },
    };
    const fetchedStats = {
      "101:A1": {
        play_count: 1,
        listen_count: 0,
        youtube_id: "overrid1234",
      },
      "202:B1": {
        play_count: 0,
        listen_count: 0,
        youtube_id: null,
      },
    };

    expect(
      resolveTrackStatsForPlaybackOverrides({
        cacheSatisfiesKeys: false,
        cachedStats,
        fetchedStats,
      }),
    ).toEqual(fetchedStats);
  });

  it("resolveTrackStatsForPlaybackOverrides uses cached stats only when every key is satisfied", () => {
    const cachedStats = {
      "101:A1": {
        play_count: 0,
        listen_count: 0,
        youtube_id: "overrid1234",
      },
    };

    expect(
      resolveTrackStatsForPlaybackOverrides({
        cacheSatisfiesKeys: true,
        cachedStats,
        fetchedStats: {
          "999:Z9": {
            play_count: 0,
            listen_count: 0,
            youtube_id: "other123456",
          },
        },
      }),
    ).toEqual(cachedStats);
  });

  it("buildYoutubeOverridesMapFromTrackStats maps trimmed youtube_id values", () => {
    expect(
      buildYoutubeOverridesMapFromTrackStats({
        "101:A1": {
          play_count: 0,
          listen_count: 0,
          youtube_id: "  dQw4w9WgXcQ  ",
        },
        "101:A2": {
          play_count: 0,
          listen_count: 0,
          youtube_id: null,
        },
      }),
    ).toEqual(new Map([["101:A1", "dQw4w9WgXcQ"]]));
  });

  it("resolveActiveTrackHasYoutubeOverride is true while stats are pending for an override-only track", () => {
    expect(
      resolveActiveTrackHasYoutubeOverride({
        resolvedOverrideId: undefined,
        isAwaitingStatsOverride: true,
        embedVideoId: null,
        matchedVideoId: null,
      }),
    ).toBe(true);
  });

  it("resolveActiveTrackHasYoutubeOverride stays true when the embed plays an override that differs from the Discogs match", () => {
    expect(
      resolveActiveTrackHasYoutubeOverride({
        resolvedOverrideId: undefined,
        isAwaitingStatsOverride: false,
        embedVideoId: "overrid1234",
        matchedVideoId: "te2jJncBVG4",
      }),
    ).toBe(true);
  });

  it("resolveActiveTrackHasYoutubeOverride is false for a pure Discogs embed match", () => {
    expect(
      resolveActiveTrackHasYoutubeOverride({
        resolvedOverrideId: undefined,
        isAwaitingStatsOverride: false,
        embedVideoId: "te2jJncBVG4",
        matchedVideoId: "te2jJncBVG4",
      }),
    ).toBe(false);
  });

  it("resolvePlaybackTrackYoutubeOverrides keeps the active override when fetch is pending for new queue keys", () => {
    const overrides = resolvePlaybackTrackYoutubeOverrides({
      cacheSatisfiesKeys: false,
      cachedStats: {
        "101:A1": {
          play_count: 0,
          listen_count: 0,
          youtube_id: "overrid1234",
        },
      },
      fetchedStats: undefined,
    });

    expect(overrides.get("101:A1")).toBe("overrid1234");
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
