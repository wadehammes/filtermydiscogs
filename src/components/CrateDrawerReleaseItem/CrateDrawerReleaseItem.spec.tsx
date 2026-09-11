import { beforeEach, describe, it } from "@jest/globals";
import { api } from "src/api/urls";
import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerReleaseItem } from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.component";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  expectNoReleaseOpenPrefetchAfterHover,
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
const release = releaseFactory.withTitle("Drawer Row Album", 249504, {
  instance_id: "drawer-row-instance",
});

const renderCrateDrawerReleaseItem = (
  onReleaseClick?: (instanceId: string) => void,
) =>
  render(
    <CrateDrawerProvider {...(onReleaseClick ? { onReleaseClick } : {})}>
      <CrateDrawerReleaseItem
        release={release}
        packed={false}
        onPackedChange={jest.fn()}
        onRemove={jest.fn()}
        {...(onReleaseClick ? { onReleaseClick } : {})}
      />
    </CrateDrawerProvider>,
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

describe("CrateDrawerReleaseItem", () => {
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
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    renderCrateDrawerReleaseItem(onReleaseClick);

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdCrateDrawerReleaseItem"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("prefetches release detail when a row action is hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    renderCrateDrawerReleaseItem(onReleaseClick);

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("button", {
          name: `Remove ${release.basic_information.title} from crate`,
        }),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("does not prefetch release detail when onReleaseClick is omitted", async () => {
    const user = setupReleaseOpenPrefetchHoverTimers();

    renderCrateDrawerReleaseItem();

    try {
      await expectNoReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdCrateDrawerReleaseItem"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });
});
