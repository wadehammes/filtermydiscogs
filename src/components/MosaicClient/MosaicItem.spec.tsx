import { beforeEach, describe, it } from "@jest/globals";
import { api } from "src/api/urls";
import MosaicItem from "src/components/MosaicClient/MosaicItem.component";
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

describe("MosaicItem", () => {
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

  it("prefetches release detail when the tile is hovered", async () => {
    const release = releaseFactory.withTitle("Mosaic Album", 249504);
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(
      <MosaicItem
        release={release}
        totalReleases={1}
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
        hoverTarget: screen.getByRole("button", {
          name: `Open release details for ${release.basic_information.title}`,
        }),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });
});
