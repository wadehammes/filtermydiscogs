import type { RenderResult } from "@testing-library/react";
import {
  PlaylistDrawerTrackItem,
  type PlaylistDrawerTrackItemProps,
} from "src/components/PlaylistDrawerTrackItem/PlaylistDrawerTrackItem.component";
import { useReleasePlaybackState } from "src/context/releasePlayback.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { ReleasePlaybackState } from "src/types/releasePlaybackContext.types";
import { render } from "test-utils";

jest.mock("src/context/releasePlayback.context", () => ({
  useReleasePlaybackState: jest.fn(),
}));

export type PlaylistDrawerTrackItemRenderProps =
  Partial<PlaylistDrawerTrackItemProps>;

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

const defaultTrack = playlistTrackRowFactory.opening();

const defaultProps: PlaylistDrawerTrackItemProps = {
  track: defaultTrack,
  release: releaseFactory.withDisplayDefaults({ instance_id: 9001 }),
  onPlayTrack: () => {},
  onRemove: () => {},
};

export class PlaylistDrawerTrackItemPageObject extends BasePageObject {
  public testId = "fmdPlaylistDrawerTrackItem";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
    this.mockPlaybackState();
  }

  mockPlaybackState(
    overrides: Partial<typeof defaultPlaybackState> = {},
  ): void {
    jest.mocked(useReleasePlaybackState).mockReturnValue({
      ...defaultPlaybackState,
      ...overrides,
    } as ReleasePlaybackState);
  }

  private playlistDrawerTrackItemElement(
    overrides: PlaylistDrawerTrackItemRenderProps = {},
  ) {
    return <PlaylistDrawerTrackItem {...defaultProps} {...overrides} />;
  }

  renderPlaylistDrawerTrackItem(
    overrides: PlaylistDrawerTrackItemRenderProps = {},
  ): RenderResult {
    return render(this.playlistDrawerTrackItemElement(overrides));
  }
}
