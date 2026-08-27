import { api } from "src/api/urls";
import { UserActions } from "src/components/StickyHeaderBar/UserActions";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

import type { RenderResult } from "test-utils";
import { render } from "test-utils";

export type UserActionsRenderProps = {
  variant?: "mobile" | "desktop";
  showMosaic?: boolean;
  showUsername?: boolean;
};

export class UserActionsPageObject extends BasePageObject {
  public username = "testuser";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    setupDefaultCrateApiMocks(mockApi);
  }

  renderUserActions(overrides: UserActionsRenderProps = {}): RenderResult {
    return render(<UserActions {...overrides} />, {
      wrapper: ({ children }) => (
        <TestProviders
          authInitialState={testAuthenticatedAuthState}
          includeCollectionSync={false}
        >
          {children}
        </TestProviders>
      ),
    });
  }
}
