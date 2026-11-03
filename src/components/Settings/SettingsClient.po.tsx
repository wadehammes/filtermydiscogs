import SettingsClient from "src/components/Settings/SettingsClient.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  pageObjectApiError,
  pageObjectMockApi,
} from "src/tests/mocks/pageObjectMockedApi";
import {
  setupSettingsClientPageObjectMocks,
  wireDefaultUpdateUserPreferencesPageObjectMocks,
  wireDefaultUserPreferencesPageObjectMocks,
} from "src/tests/mocks/setupSettingsClientPageObjectMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/services/auth.service");
jest.mock("src/analytics/analytics");
jest.mock("src/utils/toast", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

export class SettingsClientPageObject extends BasePageObject {
  mockApi = pageObjectMockApi;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    setupSettingsClientPageObjectMocks();
  }

  mockDefaultUserPreferences(): void {
    wireDefaultUserPreferencesPageObjectMocks();
  }

  mockUserPreferences(
    preferences: ReturnType<typeof userPreferencesFactory.asApiResponse>,
  ): void {
    mockApiResponse(
      true,
      this.mockApi.userPreferences,
      preferences,
      pageObjectApiError,
    );
  }

  mockDefaultUpdateUserPreferences(): void {
    wireDefaultUpdateUserPreferencesPageObjectMocks();
  }

  mockUpdateUserPreferences(
    preferences: ReturnType<typeof userPreferencesFactory.asApiResponse>,
  ): void {
    mockApiResponse(
      true,
      this.mockApi.updateUserPreferences,
      preferences,
      pageObjectApiError,
    );
  }

  renderSettingsClient(): RenderResult {
    return render(<SettingsClient />, {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
