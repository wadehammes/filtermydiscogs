import { beforeEach, describe, it } from "@jest/globals";
import { api } from "src/api/urls";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
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
import { definedProps } from "src/utils/definedProps";
import { render, screen } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");

const ReleaseOpenPrefetchProbe = ({
  onReleaseClick,
}: {
  onReleaseClick?: (instanceId: string) => void;
}) => {
  const release = releaseFactory.withTitle("Hook Prefetch Album", 249504);
  const { prefetchPointerProps } = useReleaseOpenHandler({
    release,
    onReleaseClick,
  });

  return (
    <div
      data-testid="fmdReleaseOpenPrefetchProbe"
      {...definedProps(prefetchPointerProps ?? {})}
    />
  );
};

describe("useReleaseOpenHandler", () => {
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

  it("prefetches release detail when prefetchPointerProps fire on hover", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(<ReleaseOpenPrefetchProbe onReleaseClick={onReleaseClick} />, {
      wrapper: ({ children }) => (
        <TestProviders
          authInitialState={testAuthenticatedAuthState}
          includeCollectionSync={false}
        >
          {children}
        </TestProviders>
      ),
    });

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdReleaseOpenPrefetchProbe"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("does not prefetch release detail when onReleaseClick is omitted", async () => {
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(<ReleaseOpenPrefetchProbe />, {
      wrapper: ({ children }) => (
        <TestProviders
          authInitialState={testAuthenticatedAuthState}
          includeCollectionSync={false}
        >
          {children}
        </TestProviders>
      ),
    });

    try {
      await expectNoReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdReleaseOpenPrefetchProbe"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });
});
