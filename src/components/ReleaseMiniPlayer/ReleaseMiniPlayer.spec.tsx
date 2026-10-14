import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import {
  RELEASE_MINI_PLAYER_INSTANCE_ID,
  ReleaseMiniPlayerPageObject,
} from "src/components/ReleaseMiniPlayer/ReleaseMiniPlayer.po";
import { useReleasePlayback } from "src/context/releasePlayback.context";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsTrackFactory } from "src/tests/factories/DiscogsTrack.factory";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { expectReleaseCrateMenuAbovePlaybackDock } from "src/tests/filterControlTestHelpers";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import {
  markPlaybackVideoIntroSeen,
  PLAYBACK_VIDEO_INTRO_STORAGE_KEY,
} from "src/utils/playbackVideoIntroStorage";
import { act, render, screen, waitFor } from "test-utils";

const INSTANCE_ID = RELEASE_MINI_PLAYER_INSTANCE_ID;

let po: ReleaseMiniPlayerPageObject;

const PlaybackStarter = () => {
  const { startPlayback } = useReleasePlayback();
  const collectionRelease = po.collectionRelease;

  return (
    <button
      type="button"
      onClick={() => {
        startPlayback({ release: collectionRelease, trackPosition: "A" });
      }}
    >
      Start playback
    </button>
  );
};

const startPlaybackAndWaitForPlayer = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await act(async () => {
    await user.click(screen.getByRole("button", { name: "Start playback" }));
  });

  await waitFor(() => {
    expect(screen.getByTestId("fmdReleaseMiniPlayer")).toBeInTheDocument();
  });

  await waitFor(() => {
    expect(po.mockApi.discogsRelease).toHaveBeenCalled();
  });
};

describe("ReleaseMiniPlayer", () => {
  beforeEach(() => {
    po = new ReleaseMiniPlayerPageObject();
  });

  it("is hidden until playback starts", async () => {
    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await waitFor(() => {
      expect(screen.queryByTestId("fmdReleaseMiniPlayer")).toBeNull();
    });
  });

  it("shows the video toggle when playback relies on a user YouTube override and the release has no Discogs videos", async () => {
    const overrideVideoId = "abc12345678";
    const trackKey = `${INSTANCE_ID}:A`;

    po.mockDiscogsReleaseWithoutVideos();
    po.mockTrackStatsForOverride(trackKey, overrideVideoId);

    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Show video|Hide video/ }),
      ).toBeInTheDocument();
    });
  });

  it("renders the dock and visible iframe when autoplay playback is active", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/te2jJncBVG4"),
    );
    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "data-variant",
      "visible",
    );
    expect(screen.getByText("Never Gonna Give You Up")).toBeInTheDocument();
  });

  it("expands the dock video panel the first time playback becomes ready", async () => {
    localStorage.clear();
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "data-variant",
      "visible",
    );
    expect(localStorage.getItem(PLAYBACK_VIDEO_INTRO_STORAGE_KEY)).toBe("true");
  });

  it("auto-expands the dock video panel when autoplay playback starts", async () => {
    localStorage.clear();
    markPlaybackVideoIntroSeen();
    setupMockMatchMedia({ desktop: true });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "data-variant",
      "visible",
    );
  });

  it("auto-expands the dock video panel on mobile when autoplay playback starts", async () => {
    localStorage.clear();
    markPlaybackVideoIntroSeen();
    setupMockMatchMedia({ desktop: false });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "data-variant",
      "visible",
    );
  });

  it("auto-expands the dock video panel when the first add to an empty queue starts autoplay playback", async () => {
    localStorage.clear();
    markPlaybackVideoIntroSeen();
    setupMockMatchMedia({ desktop: false });
    document.body.setAttribute("data-collection-side-panel-open", "true");

    const EmptyQueueAdd = () => {
      const { addToQueue } = useReleasePlayback();

      return (
        <button
          type="button"
          onClick={() => {
            addToQueue({
              release: po.collectionRelease,
              trackPosition: "A",
              trackTitle: "Never Gonna Give You Up",
            });
          }}
        >
          Add to empty queue
        </button>
      );
    };

    const user = userEvent.setup();

    render(<EmptyQueueAdd />, { wrapper: po.createWrapper() });

    await act(async () => {
      await user.click(
        screen.getByRole("button", { name: "Add to empty queue" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "data-variant",
      "visible",
    );

    document.body.removeAttribute("data-collection-side-panel-open");
  });

  it("expands and collapses the video panel without changing the embed src", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const embedSrc = iframe.getAttribute("src");

    expect(screen.getByRole("button", { name: "Hide video" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Hide video" }).className,
    ).toMatch(/videoButtonActive/);

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
      "data-video-expanded",
      "true",
    );
    expect(iframe).toHaveAttribute("data-variant", "visible");
    expect(iframe.getAttribute("src")).toBe(embedSrc);

    await user.click(screen.getByRole("button", { name: "Hide video" }));

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).not.toHaveAttribute(
      "data-video-expanded",
    );
    expect(iframe).toHaveAttribute("data-variant", "hidden");
    expect(iframe.getAttribute("src")).toBe(embedSrc);

    await user.click(screen.getByRole("button", { name: "Show video" }));

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
      "data-video-expanded",
      "true",
    );
    expect(iframe).toHaveAttribute("data-variant", "visible");
    expect(iframe.getAttribute("src")).toBe(embedSrc);
  });

  it("shows drag and resize handles when the video panel is expanded on desktop", async () => {
    setupMockMatchMedia({ desktop: true });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanelHandle"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanelResetButton"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanelCloseButton"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanel"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByTestId("fmdReleasePlaybackVideoPanelResizeHandle"),
    ).toHaveLength(4);
  });

  it("uses a full-width docked video panel on mobile with a close bar", async () => {
    setupMockMatchMedia({ desktop: false });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanel"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanelCloseButton"),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("fmdReleasePlaybackVideoPanelHandle"),
    ).toBeNull();
    expect(
      screen.queryByTestId("fmdReleasePlaybackVideoPanelResizeHandle"),
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: "Close video panel" }));

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).not.toHaveAttribute(
      "data-video-expanded",
    );
  });

  it("collapses the mobile video panel when the crate drawer opens", async () => {
    setupMockMatchMedia({ desktop: false });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    document.body.insertAdjacentHTML(
      "beforeend",
      '<div data-collection-side-panel-open="true"></div>',
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).not.toHaveAttribute(
        "data-video-expanded",
      );
    });

    document.querySelector("[data-collection-side-panel-open]")?.remove();
  });

  it("collapses the mobile video panel when the filters drawer opens", async () => {
    setupMockMatchMedia({ desktop: false });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    document.body.insertAdjacentHTML(
      "beforeend",
      '<div data-filters-drawer-open="true"></div>',
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).not.toHaveAttribute(
        "data-video-expanded",
      );
    });

    document.querySelector("[data-filters-drawer-open]")?.remove();
  });

  it("re-opens the mobile video panel while the filters drawer stays open", async () => {
    setupMockMatchMedia({ desktop: false });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    document.body.insertAdjacentHTML(
      "beforeend",
      '<div data-filters-drawer-open="true"></div>',
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).not.toHaveAttribute(
        "data-video-expanded",
      );
    });

    await user.click(screen.getByRole("button", { name: "Show video" }));

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
      "data-video-expanded",
      "true",
    );

    document.querySelector("[data-filters-drawer-open]")?.remove();
  });

  it("loads the next video via postMessage when advancing tracks with the panel visible", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const initialSrc = iframe.getAttribute("src");

    expect(initialSrc).toContain("te2jJncBVG4");
    expect(iframe).toHaveAttribute("data-variant", "visible");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Next track" }),
      ).not.toBeDisabled();
    });

    po.mockLoadAndPlayYoutubeVideo.mockClear();

    await user.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-playback-video-loading",
        "true",
      );
    });

    await waitFor(() => {
      expect(po.mockLoadAndPlayYoutubeVideo).toHaveBeenCalledWith(
        expect.objectContaining({
          iframe,
          videoId: "abc12345678",
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("Never Gonna Give You Up (Instrumental)"),
      ).toBeInTheDocument();
    });

    expect(iframe.getAttribute("src")).toBe(initialSrc);
  });

  it("loads the next video via postMessage when advancing tracks with the panel hidden", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const initialSrc = iframe.getAttribute("src");

    expect(initialSrc).toContain("te2jJncBVG4");

    await user.click(screen.getByRole("button", { name: "Hide video" }));

    expect(iframe).toHaveAttribute("data-variant", "hidden");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Next track" }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(
        screen.getByText("Never Gonna Give You Up (Instrumental)"),
      ).toBeInTheDocument();
    });

    expect(iframe.getAttribute("src")).toBe(initialSrc);
    expect(po.mockLoadAndPlayYoutubeVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        iframe,
        videoId: "abc12345678",
      }),
    );
  });

  it("shows the video panel without reloading the embed src after advancing while hidden", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const initialSrc = iframe.getAttribute("src");

    expect(initialSrc).toContain("te2jJncBVG4");

    await user.click(screen.getByRole("button", { name: "Hide video" }));

    expect(iframe).toHaveAttribute("data-variant", "hidden");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Next track" }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(
        screen.getByText("Never Gonna Give You Up (Instrumental)"),
      ).toBeInTheDocument();
    });

    expect(iframe.getAttribute("src")).toBe(initialSrc);

    await user.click(screen.getByRole("button", { name: "Show video" }));

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
      "data-video-expanded",
      "true",
    );
    expect(iframe).toHaveAttribute("data-variant", "visible");
    expect(iframe.getAttribute("src")).toBe(initialSrc);
  });

  it("advances the queue when the embed reports playback ended while the document is hidden", async () => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });

    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Next track" }),
      ).not.toBeDisabled();
    });

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const contentWindow = { postMessage: jest.fn() } as unknown as Window;

    act(() => {
      Object.defineProperty(iframe, "contentWindow", {
        configurable: true,
        value: contentWindow,
      });
    });

    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({ event: "onStateChange", info: 2 }),
          origin: "https://www.youtube-nocookie.com",
          source: contentWindow,
        }),
      );
    });

    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({ event: "onStateChange", info: 0 }),
          origin: "https://www.youtube-nocookie.com",
          source: contentWindow,
        }),
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText("Never Gonna Give You Up (Instrumental)"),
      ).toBeInTheDocument();
    });

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  it("keeps the video panel open when advancing tracks", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Next track" }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(
        screen.getByText("Never Gonna Give You Up (Instrumental)"),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
      "data-video-expanded",
      "true",
    );
    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "data-variant",
      "visible",
    );
  });

  it("advances to the next track from the dock controls", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Next track" }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(
        screen.getByText("Never Gonna Give You Up (Instrumental)"),
      ).toBeInTheDocument();
    });
  });

  it("returns to the previous track from the dock controls", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Next track" }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(
        screen.getByText("Never Gonna Give You Up (Instrumental)"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Previous track" }));

    await waitFor(() => {
      expect(
        screen.getAllByText("Never Gonna Give You Up").length,
      ).toBeGreaterThan(0);
    });
  });

  it("advances through a queued track added from another release", async () => {
    const secondRelease = releaseFactory.withDisplayDefaults({
      instance_id: "instance-100002",
      basic_information: basicInformationFactory.build({
        id: 100002,
        title: "Short EP",
        resource_url: "https://api.discogs.com/releases/100002",
      }),
    });

    po.mockFetchDiscogsRelease(po.releaseDetail, {
      "100002": discogsReleaseJsonFactory.withTracklistAndVideos({
        id: 100002,
        tracklist: [
          discogsTrackFactory.build({
            position: "1",
            title: "Short A",
            duration: "2:00",
            type_: "track",
          }),
        ],
        videos: [
          discogsVideoFactory.youtube({
            description: "Short A",
            duration: 120,
            title: "Short A",
            uri: "https://www.youtube.com/watch?v=def98765432",
          }),
        ],
      }),
    });

    const QueueAndPlaybackControls = () => {
      const { startPlayback, addToQueue, queue } = useReleasePlayback();

      return (
        <>
          <button
            type="button"
            onClick={() => {
              startPlayback({
                release: po.collectionRelease,
                trackPosition: "A",
              });
            }}
          >
            Start playback
          </button>
          <button
            type="button"
            onClick={() => {
              addToQueue({
                release: secondRelease,
                trackPosition: "1",
                trackTitle: "Short A",
              });
            }}
          >
            Queue second release
          </button>
          <span data-testid="fmdQueueLength">{queue.length}</span>
        </>
      );
    };

    const user = userEvent.setup();

    render(<QueueAndPlaybackControls />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Next track" }),
      ).not.toBeDisabled();
    });

    await user.click(
      screen.getByRole("button", { name: "Queue second release" }),
    );

    await user.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(
        screen.getByText("Never Gonna Give You Up (Instrumental)"),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Next track" }));

    await waitFor(() => {
      expect(screen.getByText("Short A")).toBeInTheDocument();
      expect(screen.getByTestId("fmdQueueLength")).toHaveTextContent("0");
    });
  });

  it("keeps the dock visible when playback is paused", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(screen.getByRole("button", { name: "Pause" }));

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Stop playback" })).toBeNull();
  });

  it("hides the dock when the playback session ends", async () => {
    const SessionEnder = () => {
      const { startPlayback, stopPlayback } = useReleasePlayback();

      return (
        <>
          <button
            type="button"
            onClick={() => {
              startPlayback({
                release: po.collectionRelease,
                trackPosition: "A",
              });
            }}
          >
            Start playback
          </button>
          <button type="button" onClick={stopPlayback}>
            End session
          </button>
        </>
      );
    };

    const user = userEvent.setup();

    render(<SessionEnder />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(screen.getByRole("button", { name: "End session" }));

    expect(screen.queryByTestId("fmdReleaseMiniPlayer")).toBeNull();
    expect(screen.queryByTestId("fmdPersistentYoutubeIframe")).toBeNull();
  });

  it("toggles play and pause from the dock controls", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(screen.getByRole("button", { name: "Pause" }));

    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Play" }));

    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("calls onReleaseClick when the cover and title area is clicked", async () => {
    const user = userEvent.setup();
    const onReleaseClick = jest.fn();

    render(<PlaybackStarter />, {
      wrapper: po.createWrapper(onReleaseClick),
    });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(
      screen.getByRole("button", { name: "Open Never Gonna Give You Up" }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(INSTANCE_ID);
  });

  it("stacks the playback queue above the expanded video panel", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-video-expanded",
        "true",
      );
    });

    await user.click(
      screen.getByRole("button", { name: /Open playback queue/ }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseMiniPlayer")).toHaveAttribute(
        "data-queue-over-video",
        "true",
      );
    });

    const queueDrawer = screen.getByTestId("fmdBottomDrawer");

    expect(queueDrawer.className).toMatch(/queueDrawerOverVideo/);
    expect(queueDrawer.className).toMatch(/queueElevated/);
    expect(screen.getByRole("dialog", { name: "Queue" })).toBeInTheDocument();
  });

  it("portals the crate menu above the playback dock", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(screen.getByRole("button", { name: "Add to" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseAddToMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitem", { name: /Add to crates|Manage crates/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    expectReleaseCrateMenuAbovePlaybackDock();
  });

  it("adds the playing release to the active crate", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(screen.getByRole("button", { name: "Add to" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseAddToMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitem", { name: /Add to crates|Manage crates/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(po.defaultCrateWithCount.name, "i"),
      }),
    );

    await waitFor(() => {
      expect(po.mockApi.addReleaseToCrate).toHaveBeenCalled();
    });
  });

  it("removes the playing release from the active crate", async () => {
    po.mockReleaseAlreadyInCrate(po.collectionRelease);

    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<PlaybackStarter />, { wrapper: po.createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add to" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    await user.click(screen.getByRole("button", { name: "Add to" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseAddToMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitem", { name: /Add to crates|Manage crates/i }),
    );

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(po.defaultCrateWithCount.name, "i"),
      }),
    );

    await waitFor(() => {
      expect(po.mockApi.removeReleaseFromCrate).toHaveBeenCalled();
    });
  });
});
