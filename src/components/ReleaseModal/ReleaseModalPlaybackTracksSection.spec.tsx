import { describe, expect, it, jest } from "@jest/globals";
import { ReleaseModalPlaybackTracksSection } from "src/components/ReleaseModal/ReleaseModalPlaybackTracksSection.component";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { render, screen } from "test-utils";

jest.mock("src/components/ReleaseTracklist/ReleaseTracklist.component", () => ({
  ReleaseTracklist: () => null,
}));

jest.mock(
  "src/components/ReleasePlaybackPreview/ReleasePlaybackPreview.component",
  () => ({
    ReleasePlaybackPreview: () => null,
  }),
);

const noop = () => {};

describe("ReleaseModalPlaybackTracksSection", () => {
  const previewVideo = discogsVideoFactory.youtube({
    title: "Album sampler video",
  });

  it("when no track matches a Discogs video, omits duplicate preview links from the fallback", () => {
    render(
      <ReleaseModalPlaybackTracksSection
        discogsReleaseId={37060431}
        releaseTitle="World Through My Eyes"
        releaseArtistNames="Jeremias Santiago"
        tracks={[
          discogsTrackFactory.build({ position: "A1", title: "Track one" }),
        ]}
        videos={[previewVideo]}
        hasTracklistPlayback={false}
        releasePreviewVideos={[previewVideo]}
        releasePreviewTracks={[]}
        isTrackPlayable={() => false}
        userYoutubeIdByPosition={{}}
        activeTrackPosition={null}
        activePreviewTrackPosition={null}
        fallbackSearchUrl="https://www.youtube.com/results?search_query=test"
        handleTrackSelect={noop}
        handleTrackQueue={noop}
        handleTrackUnqueue={noop}
        handleAddAllToQueue={noop}
        handleRemoveAllFromQueue={noop}
        allPlayableTracksQueued={false}
        handlePreviewTrackSelect={noop}
        handlePreviewTrackQueue={noop}
        handlePreviewTrackUnqueue={noop}
        isTrackQueued={() => false}
        isTrackUnqueueable={() => false}
        isPreviewTrackQueued={() => false}
        isPreviewTrackUnqueueable={() => false}
        handleActiveTrackToggle={noop}
        isPlayingThisReleaseInBar={false}
        isPlaybackPaused={false}
        isReleasePreviewPlaying={false}
      />,
    );

    expect(
      screen.getByText(/Tracks aren't linked to videos yet/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Album sampler video" }),
    ).not.toBeInTheDocument();
  });
});
