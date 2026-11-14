import type { RenderResult } from "@testing-library/react";
import { api } from "src/api/urls";
import { PlaylistDrawerProvider } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistShareControls } from "src/components/PlaylistShareControls/PlaylistShareControls.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { playlistDetailFactory } from "src/tests/factories/PlaylistDetail.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render } from "test-utils";

jest.mock("src/api/urls");

const activePlaylistId = "11111111-2222-3333-4444-555555555555";
const mockApi = jest.mocked(api);
const playlistsApiError = new Error("Playlists API request failed");

export class PlaylistShareControlsPageObject extends BasePageObject {
  public testId = "fmdPlaylistShareControls";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(true, mockApi.playlists, [], playlistsApiError);
  }

  mockActivePlaylist(
    playlist = playlistDetailFactory.build({
      id: activePlaylistId,
      private: true,
    }),
  ) {
    mockApiResponse(true, mockApi.playlist, playlist, playlistsApiError);
    return playlist;
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