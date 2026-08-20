import type { ReactElement } from "react";
import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerDialogs } from "src/components/CrateDrawerDialogs/CrateDrawerDialogs.component";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render } from "test-utils";

export const renderCrateDrawerTree = (ui: ReactElement) =>
  render(
    <CrateDrawerProvider>
      {ui}
      <CrateDrawerDialogs />
    </CrateDrawerProvider>,
    {
      wrapper: ({ children }) => (
        <TestProviders authInitialState={testAuthenticatedAuthState}>
          {children}
        </TestProviders>
      ),
    },
  );
