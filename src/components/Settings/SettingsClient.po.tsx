import { api } from "src/api/urls";
import SettingsClient from "src/components/Settings/SettingsClient.component";
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
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { discogsCollectionFieldsResponseFactory } from "src/tests/factories/DiscogsCollectionFieldsResponse.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("src/utils/toast", () => ({
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
  mockApi = mockApi;

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

    setupDefaultCrateApiMocks(this.mockApi);
    mockApiResponse(
      true,
      this.mockApi.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      apiError,
    );
    mockApiResponse(
      true,
      this.mockApi.updateUserPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      apiError,
    );
    mockApiResponse(
      true,
      this.mockApi.discogsCollection,
      collectionFactory.empty(),
      apiError,
    );
    mockApiResponse(
      true,
      this.mockApi.collectionFields,
      discogsCollectionFieldsResponseFactory.forReleaseNotes(),
      apiError,
    );
    this.mockApi.clearData.mockResolvedValue(
      crateMutationSuccessFactory.build(),
    );
    this.mockApi.logout.mockResolvedValue(crateMutationSuccessFactory.build());
  }

  renderSettingsClient(): RenderResult {
    return render(<SettingsClient />, {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
