import type { RenderResult } from "@testing-library/react";
import {
  PublicPlaylistTrackItem,
  type PublicPlaylistTrackItemProps,
} from "src/components/PublicPlaylistTrackItem/PublicPlaylistTrackItem.component";
import {
  useReleasePlaybackActions,
  useReleasePlaybackState,
} from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type {
  ReleasePlaybackActions,
  ReleasePlaybackState,
} from "src/types/releasePlaybackContext.types";
import { render } from "test-utils";

jest.mock("src/context/releasePlayback.context", () => ({
  useReleasePlaybackState: jest.fn(),
  useReleasePlaybackActions: jest.fn(),
}));

const defaultPlaybackActions: Pick<ReleasePlaybackActions, "togglePlayback"> = {
  togglePlayback: () => {},
};

export type PublicPlaylistTrackItemRenderProps =
  Partial<PublicPlaylistTrackItemProps>;

const defaultPlaybackState: Pick<
  ReleasePlaybackState,
  | "release"
  | "activeTrackPosition"
  | "isReleasePreview"
  | "isMiniPlayerVisible"
  | "isPaused"
  | "isPlaying"
> = {
  release: null,
  activeTrackPosition: null,
  isReleasePreview: false,
  isMiniPlayerVisible: false,
  isPaused: false,
  isPlaying: false,
};

const defaultProps: PublicPlaylistTrackItemProps = {
  track: playlistTrackRowFactory.opening(),
  release: releaseFactory.withDisplayDefaults({ instance_id: 9001 }),
  index: 1,
  onPlayTrack: () => {},
};

export class PublicPlaylistTrackItemPageObject extends BasePageObject {
  public testId = "fmdPublicPlaylistTrackItem";

  public togglePlayback = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
    this.mockPlaybackState();
    this.mockPlaybackActions();
  }

  mockPlaybackState(
    overrides: Partial<typeof defaultPlaybackState> = {},
  ): void {
    jest.mocked(useReleasePlaybackState).mockReturnValue({
      ...defaultPlaybackState,
      ...overrides,
    } as ReleasePlaybackState);
  }

  mockPlaybackActions(
    overrides: Partial<typeof defaultPlaybackActions> = {},
  ): void {
    jest.mocked(useReleasePlaybackActions).mockReturnValue({
      ...defaultPlaybackActions,
      togglePlayback: this.togglePlayback,
      ...overrides,
    } as ReleasePlaybackActions);
  }

  private publicPlaylistTrackItemElement(
    overrides: PublicPlaylistTrackItemRenderProps = {},
  ) {
    return <PublicPlaylistTrackItem {...defaultProps} {...overrides} />;
  }

  renderPublicPlaylistTrackItem(
    overrides: PublicPlaylistTrackItemRenderProps = {},
  ): RenderResult {
    return render(this.publicPlaylistTrackItemElement(overrides));
  }
}
