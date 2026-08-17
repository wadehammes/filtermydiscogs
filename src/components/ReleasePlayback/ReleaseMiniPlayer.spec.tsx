import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import * as apiHelpers from "src/api/helpers";
import { ReleaseMiniPlayer } from "src/components/ReleasePlayback/ReleaseMiniPlayer.component";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupDiscogsReleaseQueryMock } from "src/tests/mocks/setupDiscogsReleaseQueryMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { definedProps } from "src/utils/definedProps";
import {
  markPlaybackVideoIntroSeen,
  PLAYBACK_VIDEO_INTRO_STORAGE_KEY,
} from "src/utils/playbackVideoIntroStorage";
import { render, screen, waitFor } from "test-utils";

jest.mock("src/hooks/queries/useDiscogsReleaseQuery");
jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

const RELEASE_ID = 249504;

const releaseDetail = discogsReleaseJsonFactory.withTracklistAndVideos({
  id: RELEASE_ID,
  videos: [
    {
      description: "Rick Astley - Never Gonna Give You Up",
      duration: 330,
      embed: true,
      title: "Rick Astley - Never Gonna Give You Up",
      uri: "https://www.youtube.com/watch?v=te2jJncBVG4",
    },
    {
      description: "Rick Astley - Never Gonna Give You Up (Instrumental)",
      duration: 330,
      embed: true,
      title: "Rick Astley - Never Gonna Give You Up (Instrumental)",
      uri: "https://www.youtube.com/watch?v=abc12345678",
    },
  ],
});

const INSTANCE_ID = "instance-249504";

const collectionRelease = releaseFactory.withDisplayDefaults({
  instance_id: INSTANCE_ID,
  basic_information: basicInformationFactory.build({
    id: RELEASE_ID,
    title: "Never Gonna Give You Up",
    resource_url: `https://api.discogs.com/releases/${RELEASE_ID}`,
  }),
});

const PlaybackStarter = () => {
  const { startPlayback } = useReleasePlayback();

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

const createWrapper = (onReleaseClick?: (instanceId: string) => void) => {
  return ({ children }: { children: ReactNode }) => (
    <TestProviders authInitialState={testAuthenticatedAuthState}>
      <ReleasePlaybackProvider>
        {children}
        <ReleaseMiniPlayer {...definedProps({ onReleaseClick })} />
      </ReleasePlaybackProvider>
    </TestProviders>
  );
};

const defaultCrate = crateFactory.defaultTestCrate();

const startPlaybackAndWaitForPlayer = async (
  user: ReturnType<typeof userEvent.setup>,
) => {
  await user.click(screen.getByRole("button", { name: "Start playback" }));

  await waitFor(() => {
    expect(screen.getByTestId("fmdReleaseMiniPlayer")).toBeInTheDocument();
  });
};

describe("ReleaseMiniPlayer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    markPlaybackVideoIntroSeen();
    setupMockMatchMedia({ desktop: true });
    setupDefaultCrateApiMocks(mockApi);
    setupDiscogsReleaseQueryMock(releaseDetail);
    mockApiResponse(
      true,
      mockApi.addReleaseToCrate,
      crateMutationSuccessFactory.build(),
      new Error("Crate API request failed"),
    );
    mockApiResponse(
      true,
      mockApi.removeReleaseFromCrate,
      crateMutationSuccessFactory.build(),
      new Error("Crate API request failed"),
    );
  });

  it("is hidden until playback starts", () => {
    render(<PlaybackStarter />, { wrapper: createWrapper() });

    expect(screen.queryByTestId("fmdReleaseMiniPlayer")).toBeNull();
  });

  it("renders the dock and visible iframe when autoplay playback is active", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

  it("expands and collapses the video panel without changing the embed src", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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
      screen.getByTestId("fmdReleasePlaybackVideoPanel"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("fmdReleasePlaybackVideoPanelResizeHandle"),
    ).toBeInTheDocument();
  });

  it("uses a full-width docked video panel on mobile with a close bar", async () => {
    setupMockMatchMedia({ desktop: false });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

  it("collapses the mobile video panel when the filters drawer opens", async () => {
    setupMockMatchMedia({ desktop: false });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

  it("keeps the video panel open when advancing tracks", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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

    jest
      .mocked(useDiscogsReleaseQuery)
      .mockImplementation(({ enabled, releaseId }) => {
        if (!enabled) {
          return {
            data: undefined,
            isLoading: false,
            isError: false,
            refetch: jest.fn(),
          } as unknown as ReturnType<typeof useDiscogsReleaseQuery>;
        }

        const detail =
          releaseId === "100002"
            ? discogsReleaseJsonFactory.withTracklistAndVideos({
                id: 100002,
                tracklist: [
                  {
                    position: "1",
                    title: "Short A",
                    duration: "2:00",
                    type_: "track",
                  },
                ],
                videos: [
                  {
                    description: "Short A",
                    duration: 120,
                    embed: true,
                    title: "Short A",
                    uri: "https://www.youtube.com/watch?v=def98765432",
                  },
                ],
              })
            : releaseDetail;

        return {
          data: {
            ...detail,
            id: Number(releaseId) || detail.id,
          },
          isLoading: false,
          isError: false,
          refetch: jest.fn(),
        } as unknown as ReturnType<typeof useDiscogsReleaseQuery>;
      });

    const QueueAndPlaybackControls = () => {
      const { startPlayback, addToQueue, queueIndex } = useReleasePlayback();

      return (
        <>
          <button
            type="button"
            onClick={() => {
              startPlayback({ release: collectionRelease, trackPosition: "A" });
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
          <span data-testid="fmdQueueIndex">{queueIndex}</span>
        </>
      );
    };

    const user = userEvent.setup();

    render(<QueueAndPlaybackControls />, { wrapper: createWrapper() });

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
      expect(screen.getByTestId("fmdQueueIndex")).toHaveTextContent("2");
    });
  });

  it("stops playback and hides the dock", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(screen.getByRole("button", { name: "Stop playback" }));

    expect(screen.queryByTestId("fmdReleaseMiniPlayer")).toBeNull();
    expect(screen.queryByTestId("fmdPersistentYoutubeIframe")).toBeNull();
  });

  it("toggles play and pause from the dock controls", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

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
      wrapper: createWrapper(onReleaseClick),
    });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(
      screen.getByRole("button", { name: "Open Never Gonna Give You Up" }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(INSTANCE_ID);
  });

  it("adds the playing release to the active crate", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(screen.getByRole("button", { name: "Add to crate" }));

    await waitFor(() => {
      expect(mockApi.addReleaseToCrate).toHaveBeenCalled();
    });
  });

  it("removes the playing release from the active crate", async () => {
    mockApiResponse(
      true,
      mockApi.fetchCrate,
      crateWithReleasesResponseFactory.withReleases(defaultCrate, [
        collectionRelease,
      ]),
      new Error("Crate API request failed"),
    );

    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Remove from crate" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Remove from crate" }));

    await waitFor(() => {
      expect(mockApi.removeReleaseFromCrate).toHaveBeenCalled();
    });
  });
});
