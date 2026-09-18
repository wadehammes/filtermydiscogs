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
import { render, screen } from "test-utils";

jest.mock("src/utils/postYoutubePlayerCommand", () => ({
  postYoutubePlayerCommand: jest.fn(),
  loadAndPlayYoutubeVideo: jest.fn(),
  loadYoutubeVideoById: jest.fn(),
  refreshYoutubeEmbedPlayerLayout: jest.fn(),
  requestYoutubeEmbedPlaybackSync: jest.fn(),
}));

const mockLoadAndPlayYoutubeVideo = jest.requireMock<{
  loadAndPlayYoutubeVideo: jest.Mock;
}>("src/utils/postYoutubePlayerCommand").loadAndPlayYoutubeVideo;
const mockRefreshYoutubeEmbedPlayerLayout = jest.requireMock<{
  refreshYoutubeEmbedPlayerLayout: jest.Mock;
}>("src/utils/postYoutubePlayerCommand").refreshYoutubeEmbedPlayerLayout;

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
        variant={variant}
      />
    </>
  );
};

describe("PersistentYoutubeIframe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("imperatively loads the initial video instead of assuming the bootstrap src already played it", () => {
    render(
      <PersistentYoutubeIframe
        videoId="te2jJncBVG4"
        videoTitle="Test video"
        variant="visible"
      />,
      { wrapper: createWrapper() },
    );

    expect(mockLoadAndPlayYoutubeVideo).toHaveBeenCalledWith({
      iframe: expect.any(HTMLIFrameElement),
      videoId: "te2jJncBVG4",
    });
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

    mockLoadAndPlayYoutubeVideo.mockClear();

    await user.click(screen.getByRole("button", { name: "Show iframe" }));

    expect(iframe).toHaveAttribute("data-variant", "visible");
    expect(iframe.getAttribute("src")).toBe(initialSrc);
    expect(mockLoadAndPlayYoutubeVideo).not.toHaveBeenCalled();
  });

  it("loads the next video via postMessage while hidden and refreshes embed layout to keep controls", async () => {
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
            variant={variant}
          />
        </>
      );
    };

    render(<VideoSwitchHarness />, { wrapper: createWrapper() });

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const initialSrc = iframe.getAttribute("src");

    mockLoadAndPlayYoutubeVideo.mockClear();
    mockRefreshYoutubeEmbedPlayerLayout.mockClear();

    await user.click(screen.getByRole("button", { name: "Switch video" }));

    expect(mockLoadAndPlayYoutubeVideo).toHaveBeenCalledWith({
      iframe: expect.any(HTMLIFrameElement),
      videoId: "abc12345678",
    });
    expect(mockRefreshYoutubeEmbedPlayerLayout).toHaveBeenCalledWith({
      iframe: expect.any(HTMLIFrameElement),
    });
    expect(iframe.getAttribute("src")).toBe(initialSrc);

    await user.click(screen.getByRole("button", { name: "Show iframe" }));

    expect(iframe).toHaveAttribute("data-variant", "visible");
    expect(iframe.getAttribute("src")).toBe(initialSrc);
    expect(mockLoadAndPlayYoutubeVideo).toHaveBeenCalledTimes(1);
  });

  it("loads the next video via postMessage while visible without reloading iframe src", async () => {
    const user = userEvent.setup();

    const VideoSwitchHarness = () => {
      const [videoId, setVideoId] = useState("te2jJncBVG4");

      return (
        <>
          <button type="button" onClick={() => setVideoId("abc12345678")}>
            Switch video
          </button>
          <PersistentYoutubeIframe
            videoId={videoId}
            videoTitle="Test video"
            autoplay
            variant="visible"
          />
        </>
      );
    };

    render(<VideoSwitchHarness />, { wrapper: createWrapper() });

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const initialSrc = iframe.getAttribute("src");

    mockLoadAndPlayYoutubeVideo.mockClear();
    mockRefreshYoutubeEmbedPlayerLayout.mockClear();

    await user.click(screen.getByRole("button", { name: "Switch video" }));

    expect(mockLoadAndPlayYoutubeVideo).toHaveBeenCalledWith({
      iframe: expect.any(HTMLIFrameElement),
      videoId: "abc12345678",
    });
    expect(mockRefreshYoutubeEmbedPlayerLayout).toHaveBeenCalledWith({
      iframe: expect.any(HTMLIFrameElement),
    });
    expect(iframe.getAttribute("src")).toBe(initialSrc);
  });

  it("refreshes embed layout on load when the panel is already visible", () => {
    render(
      <PersistentYoutubeIframe
        videoId="te2jJncBVG4"
        videoTitle="Test video"
        variant="visible"
      />,
      { wrapper: createWrapper() },
    );

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    iframe.dispatchEvent(new Event("load"));

    expect(mockRefreshYoutubeEmbedPlayerLayout).toHaveBeenCalledWith({
      iframe: expect.any(HTMLIFrameElement),
    });
  });

  it("defers loadVideoById until deferVideoLoad is cleared", async () => {
    const user = userEvent.setup();

    const DeferredLoadHarness = () => {
      const [videoId, setVideoId] = useState("te2jJncBVG4");
      const [deferVideoLoad, setDeferVideoLoad] = useState(true);

      return (
        <>
          <button type="button" onClick={() => setVideoId("abc12345678")}>
            Switch video
          </button>
          <button type="button" onClick={() => setDeferVideoLoad(false)}>
            Allow load
          </button>
          <PersistentYoutubeIframe
            videoId={videoId}
            videoTitle="Test video"
            deferVideoLoad={deferVideoLoad}
            variant="visible"
          />
        </>
      );
    };

    render(<DeferredLoadHarness />, { wrapper: createWrapper() });

    mockLoadAndPlayYoutubeVideo.mockClear();

    await user.click(screen.getByRole("button", { name: "Switch video" }));

    expect(mockLoadAndPlayYoutubeVideo).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Allow load" }));

    expect(mockLoadAndPlayYoutubeVideo).toHaveBeenCalledWith({
      iframe: expect.any(HTMLIFrameElement),
      videoId: "abc12345678",
    });
  });

  it("refreshes embed layout when opening the panel after the initial src load", async () => {
    const user = userEvent.setup();

    render(<VariantHarness videoId="te2jJncBVG4" />, {
      wrapper: createWrapper(),
    });

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    iframe.dispatchEvent(new Event("load"));
    mockRefreshYoutubeEmbedPlayerLayout.mockClear();

    await user.click(screen.getByRole("button", { name: "Show iframe" }));

    expect(mockRefreshYoutubeEmbedPlayerLayout).toHaveBeenCalledWith({
      iframe: expect.any(HTMLIFrameElement),
    });
  });
});
