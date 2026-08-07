import * as apiHelpers from "src/api/helpers";
import { PlaybackReleaseClickProvider } from "src/context/playbackReleaseClick.context";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  checkAuthStatus,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import ReleasesClient from "./ReleasesClient.component";

jest.mock("src/api/helpers");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(apiHelpers);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);
const apiError = new Error("API request failed");
const RELEASE_ID = 249504;

export class ReleasesClientPageObject extends BasePageObject {
  public modalTestId = "fmdReleaseModal";
  public cardTestId = "fmdReleaseCard";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    setupMockMatchMedia({ desktop: true });

    mockGetUsernameFromCookies.mockReturnValue("testuser");
    mockCheckAuthStatus.mockResolvedValue({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
      reconnectUsername: null,
      rateLimited: false,
    });
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: null,
      errorStatus: null,
    });

    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.fetchUserPreferences,
      { preferences: userPreferencesFactory.defaults() },
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchDiscogsCollection,
      collectionFactory.build({}, { page: 1, totalPages: 1, releaseCount: 2 }),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchCollectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchDiscogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: RELEASE_ID }),
      apiError,
    );
  }

  renderReleasesClient(): RenderResult {
    return render(
      <ReleasePlaybackProvider>
        <PlaybackReleaseClickProvider>
          <ReleasesClient />
        </PlaybackReleaseClickProvider>
      </ReleasePlaybackProvider>,
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );
  }
}
