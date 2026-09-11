import { beforeEach, describe, expect, it } from "@jest/globals";
import { api } from "src/api/urls";
import { RELEASE_OPEN_PREFETCH_HOVER_MS } from "src/constants/releaseOpenPrefetch";
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
import { clearScheduledReleaseOpenHoverPrefetch } from "src/utils/releaseOpenPrefetch";
import { render, screen } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");

const ReleaseOpenPrefetchProbe = ({
  onReleaseClick,
  release = releaseFactory.withTitle("Hook Prefetch Album", 249504),
  testId = "fmdReleaseOpenPrefetchProbe",
}: {
  onReleaseClick?: (instanceId: string) => void;
  release?: ReturnType<typeof releaseFactory.withTitle>;
  testId?: string;
}) => {
  const { prefetchPointerProps } = useReleaseOpenHandler({
    release,
    onReleaseClick,
  });

  return (
    <div data-testid={testId} {...definedProps(prefetchPointerProps ?? {})} />
  );
};

describe("useReleaseOpenHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearScheduledReleaseOpenHoverPrefetch();
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

  it("prefetches only the last hovered release when multiple rows are hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();
    const firstRelease = releaseFactory.withTitle("First Hover Album", 249504, {
      instance_id: "first-hover-instance",
    });
    const secondRelease = releaseFactory.withTitle(
      "Second Hover Album",
      888001,
      {
        instance_id: "second-hover-instance",
      },
    );

    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
      {
        "888001": discogsReleaseJsonFactory.withTracklistAndVideos({
          id: 888001,
          title: "Second Hover Album",
        }),
      },
    );

    render(
      <>
        <ReleaseOpenPrefetchProbe
          release={firstRelease}
          testId="fmdFirstReleaseOpenPrefetchProbe"
          onReleaseClick={onReleaseClick}
        />
        <ReleaseOpenPrefetchProbe
          release={secondRelease}
          testId="fmdSecondReleaseOpenPrefetchProbe"
          onReleaseClick={onReleaseClick}
        />
      </>,
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
      await user.hover(screen.getByTestId("fmdFirstReleaseOpenPrefetchProbe"));
      await user.hover(screen.getByTestId("fmdSecondReleaseOpenPrefetchProbe"));
      jest.advanceTimersByTime(RELEASE_OPEN_PREFETCH_HOVER_MS);

      expect(mockApi.discogsRelease).toHaveBeenCalledTimes(1);
      expect(mockApi.discogsRelease).toHaveBeenCalledWith(
        "888001",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
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
