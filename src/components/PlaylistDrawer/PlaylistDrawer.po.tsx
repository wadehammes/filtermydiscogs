import type { RenderResult } from "@testing-library/react";
import { api } from "src/api/urls";
import {
  PlaylistDrawer,
  type PlaylistDrawerProps,
} from "src/components/PlaylistDrawer/PlaylistDrawer.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render } from "test-utils";

jest.mock("src/api/urls");

export type PlaylistDrawerRenderProps = Partial<PlaylistDrawerProps>;

const defaultProps: PlaylistDrawerProps = {
  isOpen: true,
  activePlaylistId: null,
  onActivePlaylistIdChange: () => {},
};

const mockApi = jest.mocked(api);
const playlistsApiError = new Error("Playlists API request failed");

export class PlaylistDrawerPageObject extends BasePageObject {
  public testId = "fmdPlaylistDrawer";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(true, mockApi.playlists, [], playlistsApiError);
    setupMockMatchMedia({ desktop: true });
  }

  private playlistDrawerElement(overrides: PlaylistDrawerRenderProps = {}) {
    return (
      <ReleasePlaybackTestTree>
        <PlaylistDrawer {...defaultProps} {...overrides} />
      </ReleasePlaybackTestTree>
    );
  }

  renderPlaylistDrawer(
    overrides: PlaylistDrawerRenderProps = {},
  ): RenderResult {
    return render(this.playlistDrawerElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }

  rerenderPlaylistDrawer(
    rerender: RenderResult["rerender"],
    overrides: PlaylistDrawerRenderProps = {},
  ): void {
    rerender(this.playlistDrawerElement(overrides));
  }
}
