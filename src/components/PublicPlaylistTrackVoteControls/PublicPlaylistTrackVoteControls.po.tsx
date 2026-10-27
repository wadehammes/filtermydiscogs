import type { RenderResult } from "@testing-library/react";
import { api } from "src/api/urls";
import {
  PublicPlaylistTrackVoteControls,
  type PublicPlaylistTrackVoteControlsProps,
} from "src/components/PublicPlaylistTrackVoteControls/PublicPlaylistTrackVoteControls.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { render } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const voteApiError = new Error("Vote API request failed");

const defaultProps: PublicPlaylistTrackVoteControlsProps = {
  playlistId: "11111111-2222-3333-4444-555555555555",
  track: playlistTrackRowFactory.opening(),
};

export type PublicPlaylistTrackVoteControlsRenderProps =
  Partial<PublicPlaylistTrackVoteControlsProps>;

export class PublicPlaylistTrackVoteControlsPageObject extends BasePageObject {
  public testId = "fmdPublicPlaylistTrackVoteControls";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    mockApiResponse(
      true,
      mockApi.votePublicPlaylistTrack,
      {
        ok: true,
        track_key: defaultProps.track.track_key,
        upCount: 1,
        downCount: 0,
        viewerVote: 1,
      },
      voteApiError,
    );
  }

  private publicPlaylistTrackVoteControlsElement(
    overrides: PublicPlaylistTrackVoteControlsRenderProps = {},
  ) {
    return <PublicPlaylistTrackVoteControls {...defaultProps} {...overrides} />;
  }

  renderPublicPlaylistTrackVoteControls(
    overrides: PublicPlaylistTrackVoteControlsRenderProps = {},
  ): RenderResult {
    return render(this.publicPlaylistTrackVoteControlsElement(overrides));
  }
}
