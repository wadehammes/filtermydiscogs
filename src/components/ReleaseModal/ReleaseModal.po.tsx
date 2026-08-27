import { api } from "src/api/urls";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleaseModal } from "./ReleaseModal.component";

jest.mock("src/api/urls");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

export const mockFiltersDispatch = jest.fn();
export const mockAllReleases: DiscogsRelease[] = [];
export const mockCollectionLoadState = {
  isLoading: false,
  isError: false,
  queryError: null,
  hasNextPage: false,
  isFetchingNextPage: false,
};

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useFiltersDispatch: () => mockFiltersDispatch,
  useAllReleases: () => mockAllReleases,
  useSelectedFormats: () => [],
  useSelectedStyles: () => [],
}));

jest.mock("src/hooks/useCollectionData.hook", () => {
  const actual = jest.requireActual<
    typeof import("src/hooks/useCollectionData.hook")
  >("src/hooks/useCollectionData.hook");

  return {
    ...actual,
    useCollectionLoadState: () => mockCollectionLoadState,
  };
});

jest.mock("src/hooks/usePillClickHandler.hook", () => ({
  usePillClickHandler: () => jest.fn(),
}));

export const mockUseMediaQuery = jest.fn((_query: string) => false);

jest.mock("src/hooks/useMediaQuery.hook", () => ({
  useMediaQuery: (query: string) => mockUseMediaQuery(query),
}));

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");
const RELEASE_ID = 249504;

export type ReleaseModalRenderProps = {
  isOpen?: boolean;
  release?: DiscogsRelease | null;
  onClose?: () => void;
  onReleaseClick?: (instanceId: string) => void;
};

export class ReleaseModalPageObject extends BasePageObject {
  public testId = "fmdReleaseModal";
  public defaultRelease = releaseFactory.withTitle(
    "Never Gonna Give You Up",
    RELEASE_ID,
  );
  public onClose = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    mockFiltersDispatch.mockReset();
    mockAllReleases.length = 0;
    mockCollectionLoadState.isLoading = false;
    mockCollectionLoadState.hasNextPage = false;
    mockCollectionLoadState.isFetchingNextPage = false;
    mockUseMediaQuery.mockReset();
    mockUseMediaQuery.mockReturnValue(false);

    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: RELEASE_ID }),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.userPreferences,
      { preferences: userPreferencesFactory.defaults() },
      apiError,
    );
  }

  mockAllReleases(releases: DiscogsRelease[]) {
    mockAllReleases.length = 0;
    mockAllReleases.push(...releases);
  }

  private releaseModalElement(overrides: ReleaseModalRenderProps = {}) {
    const {
      isOpen = true,
      release = this.defaultRelease,
      onClose,
      ...rest
    } = overrides;

    return (
      <ReleasePlaybackProvider>
        <ReleaseModal
          isOpen={isOpen}
          release={release}
          onClose={onClose ?? this.onClose}
          {...rest}
        />
      </ReleasePlaybackProvider>
    );
  }

  renderReleaseModal(overrides: ReleaseModalRenderProps = {}): RenderResult {
    return render(this.releaseModalElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
