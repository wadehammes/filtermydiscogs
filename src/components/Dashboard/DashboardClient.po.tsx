import { api } from "src/api/urls";
import { CollectionLoadingToast } from "src/components/CollectionLoadingToast/CollectionLoadingToast.component";
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
import { collectionValueFactory } from "src/tests/factories/CollectionValue.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import DashboardClient from "./DashboardClient.component";

jest.mock("./ArtistLabelCharts.component", () => ({
  ArtistLabelCharts: () => <div data-testid="fmdChartStub" />,
}));
jest.mock("./ComparativeGrowthCharts.component", () => ({
  ComparativeGrowthCharts: () => <div data-testid="fmdChartStub" />,
}));
jest.mock("./DistributionCharts.component", () => ({
  DistributionCharts: () => <div data-testid="fmdChartStub" />,
}));
jest.mock("./GrowthChart.component", () => ({
  GrowthChart: () => <div data-testid="fmdChartStub" />,
}));
jest.mock("./StyleEvolution.component", () => ({
  StyleEvolution: () => <div data-testid="fmdChartStub" />,
}));

jest.mock("src/api/urls", () => ({
  api: {
    crates: jest.fn(),
    crate: jest.fn(),
    discogsCollection: jest.fn(),
    userPreferences: jest.fn(),
    collectionValue: jest.fn(),
    mostCratedReleases: jest.fn(),
  },
}));

jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);
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
          { page: 1, totalPages: 3, releaseCount: 50, totalItems: 2500 },
        )
      : collectionFactory.build({}, { page: 1, totalPages: 1, releaseCount });

    if (options.paginatedFirstPage) {
      collectionPage.pagination.per_page = 50;
      collectionPage.pagination.urls.next =
        "https://api.discogs.com/users/testuser/collection/folders/0/releases?page=2&per_page=50";
    }

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
    mockApiResponse(true, mockApi.discogsCollection, collectionPage, apiError);
    mockApiResponse(
      true,
      mockApi.collectionValue,
      collectionValueFactory.dashboardDefaults(),
      apiError,
    );
    mockApiResponse(true, mockApi.mostCratedReleases, [], apiError);
  }

  renderDashboardClient(
    options: DashboardClientRenderOptions = {},
  ): RenderResult {
    this.setupMocks(options);

    return render(
      <ReleasePlaybackProvider>
        <CollectionLoadingToast />
        <DashboardClient />
      </ReleasePlaybackProvider>,
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );
  }
}
