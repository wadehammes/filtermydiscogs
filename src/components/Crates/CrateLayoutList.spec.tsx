import { beforeEach, describe, it } from "@jest/globals";
import { api } from "src/api/urls";
import { CrateLayoutList } from "src/components/Crates/CrateLayoutList.component";
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
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { CrateLayoutItem } from "src/types/crate.types";
import { render, screen } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");
const layoutRelease = releaseFactory.withTitle("Layout Row Album", 249504, {
  instance_id: "layout-row-instance",
});

const layoutItems: CrateLayoutItem[] = [
  {
    kind: "release",
    instance_id: "layout-row-instance",
    sort_order: 1000,
    release: layoutRelease,
    found_at: null,
  },
];

describe("CrateLayoutList", () => {
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
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
  });

  it("prefetches release detail when a row action is hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(
      <CrateLayoutList
        crateId="crate-1"
        layoutItems={layoutItems}
        hidePackedItems={false}
        packedEnabled={false}
        isPacked={() => false}
        setPacked={jest.fn()}
        removeFromCrate={jest.fn()}
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
          name: `Remove ${layoutRelease.basic_information.title} from crate`,
        }),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });
});
