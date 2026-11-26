import type { QueryClient } from "@tanstack/react-query";
import type { RenderResult } from "@testing-library/react";
import { AppToaster } from "src/components/AppToaster/AppToaster.component";
import { EmailAccountCaptureToast } from "src/components/EmailAccountCaptureToast/EmailAccountCaptureToast.component";
import { PromotionalToastHosts } from "src/components/ToastManager/PromotionalToastHosts.component";
import type { AuthState } from "src/context/auth.context";
import {
  AuthQueryKeys,
  UserContactQueryKeys,
} from "src/hooks/queries/querykeys.constants";
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
import type { UserContact } from "src/types/userContact.types";
import { defaultUserContact } from "src/utils/userContact.helpers";
import { render } from "test-utils";

jest.mock("src/api/urls");

export type EmailAccountCaptureToastRenderOptions = {
  userId?: string;
  authStatus?: AuthStatus;
  contact?: UserContact;
  queryClient?: QueryClient;
};

export class EmailAccountCaptureToastPageObject extends BasePageObject {
  public mockApi = pageObjectMockApi;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    localStorage.clear();
    setupDefaultCrateApiMocks(this.mockApi);
  }

  mockAuthenticatedMissingEmailContact(
    userId = "123",
    contact: UserContact = defaultUserContact(),
    showSupportProjectToast = false,
  ): { userId: string; contact: UserContact; authStatus: AuthStatus } {
    const authStatus = authStatusFactory.authenticated({
      userId,
      showSupportProjectToast,
    });

    mockApiResponse(
      true,
      this.mockApi.checkAuth,
      authStatus,
      pageObjectApiError,
    );
    mockApiResponse(
      true,
      this.mockApi.userContact,
      contact,
      pageObjectApiError,
    );

    return { userId, contact, authStatus };
  }

  private authInitialState(userId: string): AuthState {
    return {
      ...testAuthenticatedAuthState,
      userId,
    };
  }

  private seedQueryCache(
    queryClient: QueryClient,
    userId: string,
    authStatus: AuthStatus,
    contact: UserContact,
  ): void {
    queryClient.setQueryData(AuthQueryKeys.all(), authStatus);
    queryClient.setQueryData(UserContactQueryKeys.byUserId(userId), contact);
  }

  private emailAccountCaptureToastElement() {
    return (
      <>
        <AppToaster />
        <EmailAccountCaptureToast />
      </>
    );
  }

  resolveAuthContact(options: EmailAccountCaptureToastRenderOptions): {
    userId: string;
    authStatus: AuthStatus;
    contact: UserContact;
  } {
    const userId = options.userId ?? "123";

    if (options.authStatus && options.contact) {
      return {
        userId,
        authStatus: options.authStatus,
        contact: options.contact,
      };
    }

    const seeded = this.mockAuthenticatedMissingEmailContact(
      userId,
      options.contact,
    );

    return {
      userId: seeded.userId,
      authStatus: seeded.authStatus,
      contact: seeded.contact,
    };
  }

  renderEmailAccountCaptureToast(
    options: EmailAccountCaptureToastRenderOptions = {},
  ): RenderResult {
    const { userId, authStatus, contact } = this.resolveAuthContact(options);
    const queryClient = options.queryClient ?? createTestQueryClient();
    this.seedQueryCache(queryClient, userId, authStatus, contact);

    return render(this.emailAccountCaptureToastElement(), {
      queryClient,
      authInitialState: this.authInitialState(userId),
    });
  }

  private promotionalToastHostsElement() {
    return (
      <>
        <AppToaster />
        <PromotionalToastHosts />
      </>
    );
  }

  renderPromotionalToastHosts(
    options: EmailAccountCaptureToastRenderOptions & {
      showSupportProjectToast?: boolean;
    } = {},
  ): RenderResult {
    const userId = options.userId ?? "123";
    const contact = options.contact ?? defaultUserContact();
    const showSupportProjectToast = options.showSupportProjectToast ?? false;
    const { authStatus } = this.mockAuthenticatedMissingEmailContact(
      userId,
      contact,
      showSupportProjectToast,
    );
    const resolvedAuthStatus = options.authStatus ?? authStatus;
    const queryClient = options.queryClient ?? createTestQueryClient();
    this.seedQueryCache(queryClient, userId, resolvedAuthStatus, contact);

    mockApiResponse(
      true,
      this.mockApi.dismissSupportProjectToast,
      { success: true },
      pageObjectApiError,
    );

    return render(this.promotionalToastHostsElement(), {
      queryClient,
      authInitialState: this.authInitialState(userId),
    });
  }
}
