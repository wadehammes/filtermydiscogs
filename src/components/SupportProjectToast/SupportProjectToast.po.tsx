import type { RenderResult } from "@testing-library/react";
import { AppToaster } from "src/components/AppToaster/AppToaster.component";
import { SupportProjectToast } from "src/components/SupportProjectToast/SupportProjectToast.component";
import {
  dismissSupportProjectToast,
  showSupportProjectToast,
} from "src/components/SupportProjectToast/supportProjectToast";
import type { AuthState } from "src/context/auth.context";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { AuthStatus } from "src/services/auth.service";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  pageObjectApiError,
  pageObjectMockApi,
} from "src/tests/mocks/pageObjectMockedApi";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import { render } from "test-utils";

jest.mock("src/api/urls");

jest.mock("src/components/SupportProjectToast/supportProjectToast", () => ({
  showSupportProjectToast: jest.fn(),
  dismissSupportProjectToast: jest.fn(),
}));

export class SupportProjectToastPageObject extends BasePageObject {
  public mockApi = pageObjectMockApi;

  public mockShowSupportProjectToast = jest.mocked(showSupportProjectToast);

  public mockDismissSupportProjectToast = jest.mocked(
    dismissSupportProjectToast,
  );

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(this.mockApi);
    mockApiResponse(
      true,
      this.mockApi.dismissSupportProjectToast,
      { success: true },
      pageObjectApiError,
    );
  }

  mockAuthenticatedSupportEligible(userId = "123"): AuthStatus {
    const authStatus = authStatusFactory.authenticated({
      userId,
      showSupportProjectToast: true,
    });

    mockApiResponse(
      true,
      this.mockApi.checkAuth,
      authStatus,
      pageObjectApiError,
    );

    return authStatus;
  }

  private authInitialState(userId: string): AuthState {
    return {
      ...testAuthenticatedAuthState,
      userId,
    };
  }

  private supportProjectToastElement() {
    return (
      <>
        <AppToaster />
        <SupportProjectToast />
      </>
    );
  }

  renderSupportProjectToast(userId = "123"): RenderResult {
    const authStatus = this.mockAuthenticatedSupportEligible(userId);
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(AuthQueryKeys.all(), authStatus);

    return render(this.supportProjectToastElement(), {
      queryClient,
      authInitialState: this.authInitialState(userId),
    });
  }
}
