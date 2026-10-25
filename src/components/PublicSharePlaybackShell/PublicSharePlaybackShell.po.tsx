import { PlaybackProvidersShell } from "src/components/PlaybackProvidersShell.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import {
  TestProviders,
  testUnauthenticatedAuthState,
} from "src/tests/utils/testProviders";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { PublicSharePlaybackShell } from "./PublicSharePlaybackShell.component";

export type PublicSharePlaybackShellRenderProps = {
  children?: React.ReactNode;
};

export class PublicSharePlaybackShellPageObject extends BasePageObject {
  readonly testId = "fmdPublicSharePlaybackShell";
  readonly childProbeTestId = "fmdPublicSharePlaybackShellChild";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderPublicSharePlaybackShell(
    overrides: PublicSharePlaybackShellRenderProps = {},
  ): RenderResult {
    return render(
      <PublicSharePlaybackShell>
        {overrides.children ?? (
          <span data-testid={this.childProbeTestId}>share content</span>
        )}
      </PublicSharePlaybackShell>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testUnauthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );
  }

  renderPublicSharePlaybackShellNestedInPlaybackShell(): RenderResult {
    return render(
      <PlaybackProvidersShell>
        <PublicSharePlaybackShell>
          <span data-testid={this.childProbeTestId}>nested</span>
        </PublicSharePlaybackShell>
      </PlaybackProvidersShell>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={testUnauthenticatedAuthState}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );
  }
}
