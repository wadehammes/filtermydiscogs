import { describe, expect, it } from "@jest/globals";
import { ReleasePlaybackProvider } from "src/context/ReleasePlaybackProvider.component";
import { useReleasePlaybackState } from "src/context/releasePlayback.context";
import type {
  ReleasePlaybackActions,
  ReleasePlaybackState,
} from "src/types/releasePlaybackContext.types";
import { render, screen } from "test-utils";

const idlePlaybackState: ReleasePlaybackState = {
  release: null,
  tracks: [],
  videos: [],
  queue: [],
  autoPlayOnQueueAdd: true,
  activeTrackIndex: 0,
  activeTrackPosition: null,
  activeTrack: null,
  activeVideoId: null,
  embedVideoId: null,
  playbackVideoId: null,
  activePlaybackTitle: null,
  isReleasePreview: false,
  isPlaying: false,
  isPaused: false,
  isMiniPlayerVisible: false,
  shouldAutoplayEmbed: false,
  isPlaybackEmbedMounted: false,
  isPlaybackReady: false,
  canPlayPrevious: false,
  canPlayNext: false,
  isLoading: false,
  isQueueBuilding: false,
};

const idlePlaybackActions: ReleasePlaybackActions = {
  startPlayback: () => undefined,
  startReleasePreview: () => undefined,
  addToQueue: () => undefined,
  addPreviewToQueue: () => undefined,
  removeFromQueue: () => undefined,
  reorderQueue: () => undefined,
  playQueueAtIndex: () => undefined,
  playNext: () => undefined,
  playPrevious: () => undefined,
  togglePlayback: () => undefined,
  registerPlaybackIframe: () => undefined,
  notifyPlaybackIframeLoaded: () => undefined,
  resumePlaybackFromGesture: () => undefined,
  clearQueue: () => undefined,
  stopPlayback: () => undefined,
};

jest.mock("src/hooks/useReleasePlaybackProvider.hook", () => ({
  useReleasePlaybackProvider: jest.fn(() => ({
    stateValue: idlePlaybackState,
    actionsValue: idlePlaybackActions,
    queue: [],
    isMiniPlayerVisible: false,
  })),
}));

const PlaybackProbe = () => {
  const { isPlaying } = useReleasePlaybackState();

  return (
    <div data-testid="fmdPlaybackProbe">{isPlaying ? "playing" : "idle"}</div>
  );
};

describe("ReleasePlaybackProvider", () => {
  it("wires useReleasePlaybackProvider values into playback context", () => {
    render(
      <ReleasePlaybackProvider>
        <PlaybackProbe />
      </ReleasePlaybackProvider>,
    );

    expect(screen.getByTestId("fmdPlaybackProbe")).toHaveTextContent("idle");
  });
});
