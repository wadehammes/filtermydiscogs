import type { RenderResult } from "@testing-library/react";
import { PlaybackDockBar } from "src/components/PlaybackDockBar/PlaybackDockBar.component";
import { ReleasePlaybackProvider } from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { definedProps } from "src/utils/definedProps";
import { render } from "test-utils";

export type PlaybackDockBarRenderProps = {
  inFlow?: boolean;
};

export class PlaybackDockBarPageObject extends BasePageObject {
  public testId = "fmdPlaybackDockBar";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private PlaybackDockBarElement(overrides: PlaybackDockBarRenderProps = {}) {
    return (
      <TestProviders authInitialState={testAuthenticatedAuthState}>
        <ReleasePlaybackProvider>
          <PlaybackDockBar {...definedProps(overrides)} />
        </ReleasePlaybackProvider>
      </TestProviders>
    );
  }

  renderPlaybackDockBar(
    overrides: PlaybackDockBarRenderProps = {},
  ): RenderResult {
    return render(this.PlaybackDockBarElement(overrides));
  }

  rerenderPlaybackDockBar(
    rerender: RenderResult["rerender"],
    overrides: PlaybackDockBarRenderProps = {},
  ): void {
    rerender(this.PlaybackDockBarElement(overrides));
  }
}
