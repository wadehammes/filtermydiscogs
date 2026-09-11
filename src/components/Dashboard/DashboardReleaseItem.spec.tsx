import { beforeEach, describe, it } from "@jest/globals";
import { api } from "src/api/urls";
import { DashboardReleaseItem } from "src/components/Dashboard/DashboardReleaseItem.component";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");

describe("DashboardReleaseItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );
    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
      apiError,
    );
  });

  it("prefetches release detail when the row shell is hovered", async () => {
    const release = releaseFactory.withTitle("Dashboard Album", 249504);
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(
      <DashboardReleaseItem
        release={release}
        onReleaseClick={onReleaseClick}
      />,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdDashboardReleaseItem"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("prefetches release detail when the artist link is hovered", async () => {
    const release = releaseFactory.withTitle("Dashboard Album", 249504);
    const artistName =
      release.basic_information.artists[0]?.name ?? "Test Artist";
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(
      <DashboardReleaseItem
        release={release}
        onReleaseClick={onReleaseClick}
      />,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testAuthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("link", { name: artistName }),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });
});
