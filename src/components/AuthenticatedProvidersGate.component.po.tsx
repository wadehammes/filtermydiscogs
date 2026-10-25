import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
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
let gatePathnameContextValue = "/";

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
  readonly authenticatedDynamicTestId = "fmdAuthenticatedProvidersDynamic";
  readonly childProbeTestId = "fmdAuthenticatedProvidersGateChild";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  setPathname(pathname: string): void {
    gatePathnameContextValue = pathname;
    mockUsePathname.mockReturnValue(pathname);
  }

  renderAuthenticatedProvidersGate(
    overrides: AuthenticatedProvidersGateRenderProps = {},
  ): RenderResult {
    this.setPathname(overrides.pathname ?? "/");

    const authInitialState =
      overrides.authInitialState ?? testUnauthenticatedAuthState;

    return render(
      <PathnameContext.Provider value={gatePathnameContextValue}>
        <AuthenticatedProvidersGate>
          <div data-testid={this.childProbeTestId}>child</div>
        </AuthenticatedProvidersGate>
      </PathnameContext.Provider>,
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
