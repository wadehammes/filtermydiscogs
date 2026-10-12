import { describe, expect, it } from "@jest/globals";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  DiscogsTrack,
  DiscogsVideo,
} from "src/types/discogs-release-detail.types";
import {
  createQueueItem,
  resolveQueueItemYoutubeVideoId,
} from "src/utils/playbackQueue";
import {
  buildReleasePlaybackMatchIndex,
  resolvePlayableTrackAtPosition,
} from "src/utils/releasePlayback";
import { resolveTrackPlaybackYoutubeVideoId } from "src/utils/trackPlaybackYoutube";

describe("trackPlaybackYoutube", () => {
  const release = releaseFactory.build({ instance_id: "101" });
  const tracks: DiscogsTrack[] = [
    discogsTrackFactory.build({
      position: "A1",
      title: "First",
      type_: "track",
    }),
    discogsTrackFactory.build({
      position: "A2",
      title: "Second",
      type_: "track",
    }),
  ];
  const videos: DiscogsVideo[] = [
    discogsVideoFactory.youtube({
      uri: "https://www.youtube.com/watch?v=abc12345678",
      title: "First",
    }),
  ];
  const matchIndex = buildReleasePlaybackMatchIndex(tracks, videos);

  it("resolveTrackPlaybackYoutubeVideoId prefers a user override over Discogs match", () => {
    expect(
      resolveTrackPlaybackYoutubeVideoId({
        trackPosition: "A1",
        tracks,
        playbackMatchIndex: matchIndex,
        userYoutubeIdByPosition: { A1: "user1111111" },
      }),
    ).toBe("user1111111");
  });

  it("resolveTrackPlaybackYoutubeVideoId falls back to Discogs when no override", () => {
    expect(
      resolveTrackPlaybackYoutubeVideoId({
        trackPosition: "A1",
        tracks,
        playbackMatchIndex: matchIndex,
        userYoutubeIdByPosition: {},
      }),
    ).toBe("abc12345678");
  });

  it("resolveTrackPlaybackYoutubeVideoId uses override when Discogs has no match", () => {
    expect(
      resolveTrackPlaybackYoutubeVideoId({
        trackPosition: "A2",
        tracks,
        playbackMatchIndex: matchIndex,
        userYoutubeIdByPosition: { A2: "custom22222" },
      }),
    ).toBe("custom22222");
  });

  it("resolveQueueItemYoutubeVideoId prefers userYoutubeIdOverride", () => {
    const item = createQueueItem({
      release,
      trackPosition: "A2",
      trackTitle: "Second",
    });

    expect(
      resolveQueueItemYoutubeVideoId({
        item,
        tracks,
        videos,
        userYoutubeIdOverride: "override33333",
      }),
    ).toBe("override33333");
  });

  it("resolvePlayableTrackAtPosition stays unchanged for unmatched positions", () => {
    expect(
      resolvePlayableTrackAtPosition({
        trackPosition: "A2",
        tracks,
        playbackMatchIndex: matchIndex,
      }),
    ).toBeNull();
  });
});
