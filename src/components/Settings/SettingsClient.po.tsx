import { api } from "src/api/urls";
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
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import SettingsClient from "./SettingsClient.component";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockApi = jest.mocked(api);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);
const apiError = new Error("API request failed");

export class SettingsClientPageObject extends BasePageObject {
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
      mockApi.userPreferences,
      { preferences: userPreferencesFactory.defaults() },
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.updateUserPreferences,
      { preferences: userPreferencesFactory.defaults() },
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.discogsCollection,
      collectionFactory.empty(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
    mockApi.clearData.mockResolvedValue({ success: true });
    mockApi.logout.mockResolvedValue({ success: true });
  }

  renderSettingsClient(): RenderResult {
    return render(<SettingsClient />, {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
