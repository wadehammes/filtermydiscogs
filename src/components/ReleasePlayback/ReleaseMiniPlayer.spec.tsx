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
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupDiscogsReleaseQueryMock } from "src/tests/mocks/setupDiscogsReleaseQueryMock";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { definedProps } from "src/utils/definedProps";
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
    expect(screen.getByText("Never Gonna Give You Up")).toBeInTheDocument();
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
