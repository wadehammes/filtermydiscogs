import * as apiHelpers from "src/api/helpers";
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
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import DashboardClient from "./DashboardClient.component";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => <div data-testid="fmdDynamicChartStub" />,
}));

jest.mock("src/api/helpers", () => ({
  fetchCrates: jest.fn(),
  fetchCrate: jest.fn(),
  fetchDiscogsCollection: jest.fn(),
  fetchUserPreferences: jest.fn(),
  fetchCollectionValue: jest.fn(),
  fetchMostCratedReleases: jest.fn(),
}));

jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(apiHelpers);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);
const apiError = new Error("API request failed");

export type DashboardClientRenderOptions = {
  releaseCount?: number;
  paginatedFirstPage?: boolean;
};

export class DashboardClientPageObject extends BasePageObject {
  public testId = "fmdDashboardClient";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(options: DashboardClientRenderOptions = {}) {
    jest.clearAllMocks();
    setupMockMatchMedia({ desktop: true });

    const releaseCount = options.releaseCount ?? 3;
    const collectionPage = options.paginatedFirstPage
      ? collectionFactory.build(
          {},
          { page: 1, totalPages: 3, releaseCount: 50 },
        )
      : collectionFactory.build({}, { page: 1, totalPages: 1, releaseCount });

    if (options.paginatedFirstPage) {
      collectionPage.pagination.per_page = 50;
      collectionPage.pagination.urls.next =
        "https://api.discogs.com/users/testuser/collection/folders/0/releases?page=2&per_page=50";
    }

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
      collectionPage,
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchCollectionValue,
      { minimum: 100, median: 500, maximum: 1000 },
      apiError,
    );
    mockApiResponse(true, mockApi.fetchMostCratedReleases, [], apiError);
  }

  renderDashboardClient(
    options: DashboardClientRenderOptions = {},
  ): RenderResult {
    this.setupMocks(options);

    return render(<DashboardClient />, {
      authInitialState: testAuthenticatedAuthState,
    });
  }
}
