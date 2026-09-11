import type { ReactElement } from "react";
import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerDialogs } from "src/components/CrateDrawerDialogs/CrateDrawerDialogs.component";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { definedProps } from "src/utils/definedProps";
import { render } from "test-utils";

interface RenderCrateDrawerTreeOptions {
  onReleaseClick?: (instanceId: string) => void;
}

export const renderCrateDrawerTree = (
  ui: ReactElement,
  options: RenderCrateDrawerTreeOptions = {},
) =>
  render(
    <CrateDrawerProvider {...definedProps(options)}>
      {ui}
      <CrateDrawerDialogs />
    </CrateDrawerProvider>,
    {
      wrapper: ({ children }) => (
        <TestProviders
          authInitialState={testAuthenticatedAuthState}
          includeCollectionSync={false}
        >
          {children}
        </TestProviders>
      ),
    },
  );
