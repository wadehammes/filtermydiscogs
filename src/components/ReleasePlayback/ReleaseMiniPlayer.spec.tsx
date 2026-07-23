import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import * as apiHelpers from "src/api/helpers";
import { ReleaseMiniPlayer } from "src/components/ReleasePlayback/ReleaseMiniPlayer.component";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
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
    jest.resetAllMocks();
    localStorage.clear();
    markPlaybackVideoIntroSeen();
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

  it("renders the dock and hidden iframe when playback is active", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/te2jJncBVG4"),
    );
    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "data-variant",
      "hidden",
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

  it("does not auto-expand the dock video panel after the intro has been seen", async () => {
    localStorage.clear();
    markPlaybackVideoIntroSeen();
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    expect(screen.getByTestId("fmdReleaseMiniPlayer")).not.toHaveAttribute(
      "data-video-expanded",
    );
    expect(screen.getByTestId("fmdPersistentYoutubeIframe")).toHaveAttribute(
      "data-variant",
      "hidden",
    );
  });

  it("expands and collapses the video panel without changing the embed src", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    const iframe = screen.getByTestId("fmdPersistentYoutubeIframe");
    const embedSrc = iframe.getAttribute("src");

    await user.click(screen.getByRole("button", { name: "Show video" }));

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
  });

  it("shows drag and resize handles when the video panel is expanded on desktop", async () => {
    setupMockMatchMedia({ desktop: true });
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    expect(
      screen.queryByTestId("fmdReleasePlaybackVideoPanelHandle"),
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: "Show video" }));

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
    await user.click(screen.getByRole("button", { name: "Show video" }));

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

  it("stops playback and hides the dock", async () => {
    const user = userEvent.setup();

    render(<PlaybackStarter />, { wrapper: createWrapper() });

    await startPlaybackAndWaitForPlayer(user);

    await user.click(screen.getByRole("button", { name: "Show video" }));

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
