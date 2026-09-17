import { describe, expect, it } from "@jest/globals";
import { useReleaseDetailPlaybackIndex } from "src/components/ReleaseModal/useReleaseDetailPlaybackIndex.hook";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { renderHook } from "test-utils";

describe("useReleaseDetailPlaybackIndex", () => {
  it("flattens tracklist and builds a playback match index", () => {
    const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: 42,
    });

    const { result } = renderHook(() =>
      useReleaseDetailPlaybackIndex({
        tracklist: releaseDetail.tracklist,
        videos: releaseDetail.videos,
      }),
    );

    expect(result.current.tracks.length).toBeGreaterThan(0);
    expect(result.current.videos).toEqual(releaseDetail.videos);
    expect(result.current.playbackMatchIndex.hasPlayableTracks).toBe(true);
    expect(
      result.current.playbackMatchIndex.trackVideoByPosition.size,
    ).toBeGreaterThan(0);
  });

  it("handles missing tracklist and videos", () => {
    const { result } = renderHook(() =>
      useReleaseDetailPlaybackIndex({
        tracklist: undefined,
        videos: undefined,
      }),
    );

    expect(result.current.tracks).toEqual([]);
    expect(result.current.videos).toEqual([]);
    expect(result.current.playbackMatchIndex.hasPlayableTracks).toBe(false);
  });
});
