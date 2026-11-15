import { describe, expect, it } from "@jest/globals";
import { resolvePlaybackDockEmbedProgressResetKey } from "src/hooks/useReleasePlaybackDockControls.hook";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";

describe("useReleasePlaybackDockControls", () => {
  it("when preview video has a YouTube id, reset key uses preview:youtubeId", () => {
    const release = releaseFactory.build();

    expect(
      resolvePlaybackDockEmbedProgressResetKey({
        release,
        previewVideo: discogsVideoFactory.youtube({
          uri: "https://www.youtube.com/watch?v=abc12345678",
        }),
        playbackVideoId: "def98765432",
      }),
    ).toBe("preview:abc12345678");
  });

  it("when playing an album track, reset key uses playback video id when present", () => {
    const release = releaseFactory.build({ instance_id: "inst-1" });

    expect(
      resolvePlaybackDockEmbedProgressResetKey({
        release,
        previewVideo: null,
        playbackVideoId: "def98765432",
      }),
    ).toBe("def98765432");
  });
});
