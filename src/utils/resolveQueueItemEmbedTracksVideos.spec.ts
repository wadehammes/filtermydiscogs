import { describe, expect, it } from "@jest/globals";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createQueueItem } from "src/utils/playbackQueue";
import { resolveQueueItemEmbedTracksVideos } from "src/utils/resolveQueueItemEmbedTracksVideos";

describe("resolveQueueItemEmbedTracksVideos", () => {
  it("reuses in-memory tracklist when the queue item matches the active release", () => {
    const release = releaseFactory.build();
    const tracks = [
      discogsTrackFactory.build({
        position: "A",
        title: "Track",
        type_: "track",
      }),
    ];
    const videos = [
      discogsVideoFactory.youtube({
        uri: "https://youtube.com/watch?v=abc",
        title: "Vid",
      }),
    ];

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
    const currentRelease = releaseFactory.build();
    const queuedRelease = releaseFactory.build();
    const cached = discogsReleaseJsonFactory.withTracklistAndVideos({
      id: Number(queuedRelease.basic_information.id),
    });

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

  it("uses tracklist embedded on the queued release when cache detail is missing", () => {
    const currentRelease = releaseFactory.build();
    const queuedRelease = releaseFactory.build({
      tracklist: [
        discogsTrackFactory.build({
          position: "A2",
          title: "Second track",
          type_: "track",
        }),
      ],
      videos: [
        discogsVideoFactory.youtube({
          uri: "https://youtube.com/watch?v=abc",
          title: "A2 vid",
        }),
      ],
    });

    expect(
      resolveQueueItemEmbedTracksVideos({
        item: createQueueItem({
          release: queuedRelease,
          trackPosition: "A2",
          trackTitle: "Second track",
        }),
        currentRelease,
        currentTracks: [],
        currentVideos: [],
        cachedReleaseDetail: null,
      }),
    ).toEqual({
      tracks: queuedRelease.tracklist,
      videos: queuedRelease.videos,
    });
  });
});
