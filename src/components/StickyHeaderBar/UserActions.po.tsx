import { UserActions } from "src/components/StickyHeaderBar/UserActions";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
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
  }

  renderUserActions(overrides: UserActionsRenderProps = {}): RenderResult {
    return render(<UserActions {...overrides} />, {
      wrapper: ({ children }) => (
        <TestProviders authInitialState={testAuthenticatedAuthState}>
          {children}
        </TestProviders>
      ),
    });
  }
}
