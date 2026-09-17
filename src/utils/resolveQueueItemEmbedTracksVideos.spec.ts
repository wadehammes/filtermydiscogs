import { describe, expect, it } from "@jest/globals";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import { resolveQueueItemEmbedTracksVideos } from "src/utils/resolveQueueItemEmbedTracksVideos";

describe("resolveQueueItemEmbedTracksVideos", () => {
  it("reuses in-memory tracklist when the queue item matches the active release", () => {
    const release = releaseFactory.build({ id: 1, instance_id: 10 });
    const tracks = [{ position: "A", title: "Track", type_: "track" as const }];
    const videos = [{ uri: "https://youtube.com/watch?v=abc", title: "Vid" }];

    expect(
      resolveQueueItemEmbedTracksVideos({
        item: createQueueItem({ release, trackPosition: "A", trackTitle: "A" }),
        currentRelease: release,
        currentTracks: tracks,
        currentVideos: videos,
        cachedReleaseDetail: null,
      }),
    ).toEqual({ tracks, videos });
  });

  it("falls back to cached release detail for other releases in the queue", () => {
    const currentRelease = releaseFactory.build({ id: 1, instance_id: 10 });
    const queuedRelease = releaseFactory.build({ id: 2, instance_id: 20 });
    const cached = discogsReleaseJsonFactory.withTracklistAndVideos({ id: 2 });

    const result = resolveQueueItemEmbedTracksVideos({
      item: createQueueItem({
        release: queuedRelease,
        trackPosition: "A",
        trackTitle: "A",
      }),
      currentRelease,
      currentTracks: [],
      currentVideos: [],
      cachedReleaseDetail: cached,
    });

    expect(result.tracks.length).toBeGreaterThan(0);
    expect(result.videos.length).toBeGreaterThan(0);
  });
});
