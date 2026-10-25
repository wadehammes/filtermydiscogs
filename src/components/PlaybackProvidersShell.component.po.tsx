import {
  EnsurePlaybackProvidersShell,
  PlaybackProvidersShell,
} from "src/components/PlaybackProvidersShell.component";
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

export class PlaybackProvidersShellPageObject extends BasePageObject {
  readonly shellTestId = "fmdPlaybackProvidersShellProbe";
  readonly ensureProbeTestId = "fmdEnsurePlaybackProvidersShellProbe";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  renderPlaybackProvidersShell(): RenderResult {
    return render(
      <PlaybackProvidersShell>
        <div data-testid={this.shellTestId}>inside shell</div>
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

  renderEnsurePlaybackProvidersShellWithoutOuterShell(): RenderResult {
    return render(
      <EnsurePlaybackProvidersShell>
        <div data-testid={this.ensureProbeTestId}>needs shell</div>
      </EnsurePlaybackProvidersShell>,
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

  renderEnsurePlaybackProvidersShellWhileCheckingAuth(): RenderResult {
    return render(
      <EnsurePlaybackProvidersShell>
        <div data-testid={this.ensureProbeTestId}>auth pending</div>
      </EnsurePlaybackProvidersShell>,
      {
        wrapper: ({ children }) => (
          <TestProviders
            authInitialState={{
              ...testUnauthenticatedAuthState,
              isCheckingAuth: true,
            }}
            skipInitialAuthCheck={false}
            includeCollectionSync={false}
          >
            {children}
          </TestProviders>
        ),
      },
    );
  }

  renderEnsurePlaybackProvidersShellInsideShell(): RenderResult {
    return render(
      <PlaybackProvidersShell>
        <EnsurePlaybackProvidersShell>
          <div data-testid={this.ensureProbeTestId}>nested</div>
        </EnsurePlaybackProvidersShell>
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
