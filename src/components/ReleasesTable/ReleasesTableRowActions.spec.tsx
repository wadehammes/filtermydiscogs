import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { ReleasesTableRowActions } from "src/components/ReleasesTable/ReleasesTableRowActions.component";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
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
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render, screen } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("ReleasesTableRowActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 12345 }),
    );
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      new Error("API request failed"),
    );
  });

  it("prefetches release detail when a row action is hovered", async () => {
    const release = releaseFactory.forNotesEditor(12345, { notes: [] });
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(
      <ReleasePlaybackTestTree>
        <ReleasesTableRowActions
          release={release}
          onReleaseClick={onReleaseClick}
        />
      </ReleasePlaybackTestTree>,
      {
        wrapper: ({ children }) => (
          <TestProviders authInitialState={testAuthenticatedAuthState}>
            {children}
          </TestProviders>
        ),
      },
    );

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdReleaseTableAddToQueueButton"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("opens release details and notes from icon actions", async () => {
    const release = releaseFactory.forNotesEditor(12345, { notes: [] });
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    render(
      <ReleasePlaybackTestTree>
        <ReleasesTableRowActions
          release={release}
          onReleaseClick={onReleaseClick}
        />
      </ReleasePlaybackTestTree>,
      {
        wrapper: ({ children }) => (
          <TestProviders authInitialState={testAuthenticatedAuthState}>
            {children}
          </TestProviders>
        ),
      },
    );

    await user.click(
      screen.getByRole("button", { name: "Open release details" }),
    );
    expect(onReleaseClick).toHaveBeenCalledWith(release);

    await user.click(screen.getByRole("button", { name: "Add release notes" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
