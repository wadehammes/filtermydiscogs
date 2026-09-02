import { api } from "src/api/urls";
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
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { authUrlParamsFactory } from "src/tests/factories/AuthUrlParams.factory";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { AppNavigationTestRoot } from "src/tests/mocks/setupMockAppNavigation.mock";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import ReleasesClient from "./ReleasesClient.component";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);
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
    mockCheckAuthStatus.mockResolvedValue(authStatusFactory.authenticated());
    mockParseAuthUrlParams.mockReturnValue(authUrlParamsFactory.empty());

    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      apiError,
    );
    this.mockCollectionWithReleaseCount(2);
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
  }

  mockCollectionWithReleaseCount(releaseCount: number) {
    const releases = releaseFactory.buildList(releaseCount);
    const page = collectionFactory.build(
      { releases },
      { page: 1, totalPages: 1, releaseCount: releases.length },
    );
    page.pagination.urls.next = "";

    mockApiResponse(true, mockApi.discogsCollection, page, apiError);
  }

  renderReleasesClientUi(initialUrl = "/releases") {
    return (
      <AppNavigationTestRoot initialUrl={initialUrl}>
        <ReleasePlaybackProvider>
          <ReleasesClient />
        </ReleasePlaybackProvider>
      </AppNavigationTestRoot>
    );
  }

  renderReleasesClient(initialUrl = "/releases"): RenderResult {
    return render(this.renderReleasesClientUi(initialUrl), {
      authInitialState: testAuthenticatedAuthState,
    });
  }
}
