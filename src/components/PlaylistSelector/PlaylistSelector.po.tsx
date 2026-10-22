import type { RenderResult } from "@testing-library/react";
import { api } from "src/api/urls";
import {
  PlaylistSelector,
  type PlaylistSelectorProps,
} from "src/components/PlaylistSelector/PlaylistSelector.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render } from "test-utils";

jest.mock("src/api/urls");

export type PlaylistSelectorRenderProps = Partial<PlaylistSelectorProps>;

const defaultProps: PlaylistSelectorProps = {
  activePlaylistId: null,
  onPlaylistChange: () => {},
};

const mockApi = jest.mocked(api);
const playlistsApiError = new Error("Playlists API request failed");

export class PlaylistSelectorPageObject extends BasePageObject {
  public testId = "fmdPlaylistSelector";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    mockApiResponse(true, mockApi.playlists, [], playlistsApiError);
  }

  private playlistSelectorElement(overrides: PlaylistSelectorRenderProps = {}) {
    return <PlaylistSelector {...defaultProps} {...overrides} />;
  }

  renderPlaylistSelector(
    overrides: PlaylistSelectorRenderProps = {},
  ): RenderResult {
    return render(this.playlistSelectorElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }

  rerenderPlaylistSelector(
    rerender: RenderResult["rerender"],
    overrides: PlaylistSelectorRenderProps = {},
  ): void {
    rerender(this.playlistSelectorElement(overrides));
  }
}
