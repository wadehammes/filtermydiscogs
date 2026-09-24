import { AuthenticatedProvidersGate } from "src/components/AuthenticatedProvidersGate.component";
import type { AuthState } from "src/context/auth.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import {
  TestProviders,
  testAuthenticatedAuthState,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

const mockUsePathname = jest.fn(() => "/");

jest.mock("next/navigation", () => ({
  ...jest.requireActual<typeof import("next/navigation")>("next/navigation"),
  usePathname: () => mockUsePathname(),
  useRouter: () => createMockAppRouter(),
  useSearchParams: () => new URLSearchParams(),
}));

export type AuthenticatedProvidersGateRenderProps = {
  authInitialState?: AuthState;
  pathname?: string;
};

export class AuthenticatedProvidersGatePageObject extends BasePageObject {
  readonly playbackShellTestId = "fmdPlaybackProvidersShell";
  readonly authenticatedDynamicTestId = "fmdAuthenticatedProvidersDynamic";
  readonly childProbeTestId = "fmdAuthenticatedProvidersGateChild";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  setPathname(pathname: string): void {
    mockUsePathname.mockReturnValue(pathname);
  }

  renderAuthenticatedProvidersGate(
    overrides: AuthenticatedProvidersGateRenderProps = {},
  ): RenderResult {
    this.setPathname(overrides.pathname ?? "/");

    const authInitialState =
      overrides.authInitialState ?? testUnauthenticatedAuthState;

    return render(
      <AuthenticatedProvidersGate>
        <div data-testid={this.childProbeTestId}>child</div>
      </AuthenticatedProvidersGate>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={authInitialState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );
  }
}

export { testAuthenticatedAuthState, testUnauthenticatedAuthState };
