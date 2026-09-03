import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useState } from "react";
import { PersistentYoutubeIframe } from "src/components/PersistentYoutubeIframe/PersistentYoutubeIframe.component";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { transitionYoutubeIframeToVideo } from "src/utils/releasePlayback";
import { render, screen } from "test-utils";

jest.mock("src/utils/postYoutubePlayerCommand", () => ({
  postYoutubePlayerCommand: jest.fn(),
  loadYoutubeVideoById: jest.fn(),
  transitionYoutubeIframeToVideo: jest.fn(),
  requestYoutubePlayerState: jest.fn(),
}));

const mockTransitionYoutubeIframeToVideo = jest.mocked(
  transitionYoutubeIframeToVideo,
);

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <TestProviders
      authInitialState={testAuthenticatedAuthState}
      includeCollectionSync={false}
    >
      <ReleasePlaybackProvider>{children}</ReleasePlaybackProvider>
    </TestProviders>
  );
};

const VariantHarness = ({
  initialVariant = "hidden",
  videoId,
}: {
  initialVariant?: "hidden" | "visible";
  videoId: string;
}) => {
  const [variant, setVariant] = useState<"hidden" | "visible">(initialVariant);

  return (
    <>
      <button type="button" onClick={() => setVariant("visible")}>
        Show iframe
      </button>
      <PersistentYoutubeIframe
        videoId={videoId}
        videoTitle="Test video"
        playbackKey="test"
        variant={variant}
      />
    </>
  );
};

describe("PersistentYoutubeIframe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not reload iframe src when opening a hidden panel for the current video", async () => {
    const user = userEvent.setup();

    render(<VariantHarness videoId="te2jJncBVG4" />, {
      wrapper: createWrapper(),
    });

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const initialSrc = iframe.getAttribute("src");

    expect(initialSrc).toContain("te2jJncBVG4");
    expect(iframe).toHaveAttribute("data-variant", "hidden");

    await user.click(screen.getByRole("button", { name: "Show iframe" }));

    expect(iframe).toHaveAttribute("data-variant", "visible");
    expect(iframe.getAttribute("src")).toBe(initialSrc);
  });

  it("loads the next video via postMessage while hidden, then shows without src reload", async () => {
    const user = userEvent.setup();

    const VideoSwitchHarness = () => {
      const [variant, setVariant] = useState<"hidden" | "visible">("hidden");
      const [videoId, setVideoId] = useState("te2jJncBVG4");

      return (
        <>
          <button type="button" onClick={() => setVideoId("abc12345678")}>
            Switch video
          </button>
          <button type="button" onClick={() => setVariant("visible")}>
            Show iframe
          </button>
          <PersistentYoutubeIframe
            videoId={videoId}
            videoTitle="Test video"
            playbackKey="test"
            variant={variant}
          />
        </>
      );
    };

    render(<VideoSwitchHarness />, { wrapper: createWrapper() });

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const initialSrc = iframe.getAttribute("src");

    await user.click(screen.getByRole("button", { name: "Switch video" }));

    expect(mockTransitionYoutubeIframeToVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        iframe,
        videoId: "abc12345678",
      }),
    );
    expect(iframe.getAttribute("src")).toBe(initialSrc);

    await user.click(screen.getByRole("button", { name: "Show iframe" }));

    expect(iframe).toHaveAttribute("data-variant", "visible");
    expect(iframe.getAttribute("src")).toBe(initialSrc);
  });
});
