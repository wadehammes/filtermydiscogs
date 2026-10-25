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
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const playlistsApiError = new Error("Playlists API request failed");

export class PlaylistDrawerFooterPageObject extends BasePageObject {
  public testId = "fmdPlaylistDrawerFooter";
  public editMenuTestId = "fmdPlaylistDrawerEditMenu";
  public renameDialogTestId = "fmdCreatePlaylistDialog";

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
    playlist = playlistDetailFactory.build({ name: "Weekend spins" }),
  ) {
    mockApiResponse(true, mockApi.playlist, playlist, playlistsApiError);
    mockApiResponse(
      true,
      mockApi.updatePlaylist,
      { ...playlist, name: "Renamed playlist" },
      playlistsApiError,
    );
    mockApiResponse(true, mockApi.deletePlaylist, undefined, playlistsApiError);
    return playlist;
  }

  private playlistDrawerFooterElement(activePlaylistId: string | null) {
    return (
      <ReleasePlaybackTestTree>
        <PlaylistDrawerProvider
          activePlaylistId={activePlaylistId}
          selectPlaylist={() => {}}
        >
          <PlaylistDrawerFooter />
        </PlaylistDrawerProvider>
      </ReleasePlaybackTestTree>
    );
  }

  renderPlaylistDrawerFooter(
    activePlaylistId: string | null = null,
  ): RenderResult {
    return render(this.playlistDrawerFooterElement(activePlaylistId), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
