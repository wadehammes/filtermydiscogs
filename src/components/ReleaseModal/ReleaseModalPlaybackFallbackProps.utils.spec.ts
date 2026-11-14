import { describe, expect, it } from "@jest/globals";
import { getReleaseModalPlaybackFallbackProps } from "src/components/ReleaseModal/ReleaseModalPlaybackFallbackProps.utils";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";

describe("getReleaseModalPlaybackFallbackProps", () => {
  it("when preview videos render in the preview strip, omits videos from the fallback list", () => {
    const previewVideo = discogsVideoFactory.youtube({ title: "Sampler" });
    const trackVideo = discogsVideoFactory.youtube({ title: "A1" });

    expect(
      getReleaseModalPlaybackFallbackProps([trackVideo], [previewVideo]),
    ).toEqual({
      fallbackVideos: [],
      tracksLackMatchedVideos: true,
    });
  });

  it("when only main release videos exist, passes them through to the fallback", () => {
    const trackVideo = discogsVideoFactory.youtube({ title: "A1" });

    expect(getReleaseModalPlaybackFallbackProps([trackVideo], [])).toEqual({
      fallbackVideos: [trackVideo],
      tracksLackMatchedVideos: true,
    });
  });
});
