import type { RenderResult } from "@testing-library/react";
import { api } from "src/api/urls";
import { PlaylistDrawerProvider } from "src/components/PlaylistDrawer/PlaylistDrawer.context";
import { PlaylistDrawerFooter } from "src/components/PlaylistDrawerFooter/PlaylistDrawerFooter.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { playlistDetailFactory } from "src/tests/factories/PlaylistDetail.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { E2E_PLAYLIST_ID } from "src/tests/msw/e2ePlaylist.constants";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import {
  TestProviders,
  testAuthenticatedAuthState,
} from "src/tests/utils/testProviders";
import { render } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const playlistsApiError = new Error("Playlists API request failed");

export class PlaylistDrawerStatsPageObject extends BasePageObject {
  public testId = "fmdPlaylistDrawerStats";
  public statsToggleTestId = "fmdPlaylistDrawerStatsToggle";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(true, mockApi.playlists, [], playlistsApiError);
    this.mockActivePlaylist();
  }

  mockActivePlaylist(
    playlist = playlistDetailFactory.build({
      id: E2E_PLAYLIST_ID,
      private: false,
      publicViewCount: 3,
      publicPlayCount: 1,
    }),
  ) {
    mockApiResponse(true, mockApi.playlist, playlist, playlistsApiError);
    return playlist;
  }

  private playlistDrawerStatsElement() {
    return (
      <TestProviders
        authInitialState={testAuthenticatedAuthState}
        includeCollectionSync={false}
      >
        <ReleasePlaybackTestTree>
          <PlaylistDrawerProvider
            activePlaylistId={E2E_PLAYLIST_ID}
            selectPlaylist={() => {}}
          >
            <PlaylistDrawerFooter />
          </PlaylistDrawerProvider>
        </ReleasePlaybackTestTree>
      </TestProviders>
    );
  }

  renderPlaylistDrawerStats(): RenderResult {
    return render(this.playlistDrawerStatsElement());
  }
}
