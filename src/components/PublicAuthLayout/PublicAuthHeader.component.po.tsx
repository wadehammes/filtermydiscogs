import type { RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { api } from "src/api/urls";
import { PublicAuthHeader } from "src/components/PublicAuthLayout/PublicAuthHeader.component";
import type { AuthState } from "src/context/auth.context";
import { BasePageObject } from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import {
  testAuthenticatedAuthState,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testAuthStates";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);

export type PublicAuthHeaderRenderProps = {
  authenticatedNavPage?: "about" | "legal";
  currentPage?: "home" | "about" | "legal";
  authInitialState?: AuthState;
};

export class PublicAuthHeaderPageObject extends BasePageObject {
  readonly publicPageHeaderTestId = "fmdPublicPageHeader";

  constructor() {
    super();
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
  }

  private renderUi({
    authenticatedNavPage,
    currentPage = "home",
    authInitialState = testUnauthenticatedAuthState,
  }: PublicAuthHeaderRenderProps = {}): ReactElement {
    return (
      <SeedCollectionFilters releases={[releaseFactory.withDisplayDefaults()]}>
        <PublicAuthHeader
          currentPage={currentPage}
          {...(authenticatedNavPage ? { authenticatedNavPage } : {})}
        />
      </SeedCollectionFilters>
    );
  }

  renderPublicAuthHeader(
    overrides: PublicAuthHeaderRenderProps = {},
  ): RenderResult {
    const authInitialState =
      overrides.authInitialState ?? testUnauthenticatedAuthState;

    return render(this.renderUi(overrides), {
      authInitialState,
      skipInitialAuthCheck: true,
      includeCollectionSync: false,
    });
  }

  renderAuthenticatedPublicAuthHeader(
    overrides: Omit<PublicAuthHeaderRenderProps, "authInitialState"> = {},
  ): RenderResult {
    return this.renderPublicAuthHeader({
      ...overrides,
      authInitialState: testAuthenticatedAuthState,
    });
  }
}
