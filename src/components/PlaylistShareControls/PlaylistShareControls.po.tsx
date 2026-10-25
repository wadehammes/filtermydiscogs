import type { RenderResult } from "@testing-library/react";
import { PlaylistDrawerProvider } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistShareControls } from "src/components/PlaylistShareControls/PlaylistShareControls.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render } from "test-utils";

const activePlaylistId = "11111111-2222-3333-4444-555555555555";

export class PlaylistShareControlsPageObject extends BasePageObject {
  public testId = "fmdPlaylistShareControls";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private playlistShareControlsElement() {
    return (
      <TestProviders
        authInitialState={testAuthenticatedAuthState}
        includeCollectionSync={false}
      >
        <ReleasePlaybackTestTree>
          <PlaylistDrawerProvider
            activePlaylistId={activePlaylistId}
            selectPlaylist={() => {}}
          >
            <PlaylistShareControls />
          </PlaylistDrawerProvider>
        </ReleasePlaybackTestTree>
      </TestProviders>
    );
  }

  renderPlaylistShareControls(): RenderResult {
    return render(this.playlistShareControlsElement());
  }
}
