import type { RenderResult } from "@testing-library/react";
import {
  PlaylistSelector,
  type PlaylistSelectorProps,
} from "src/components/PlaylistSelector/PlaylistSelector.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";

export type PlaylistSelectorRenderProps = Partial<PlaylistSelectorProps>;

const defaultProps: PlaylistSelectorProps = {
  activePlaylistId: null,
  onPlaylistChange: () => {},
};

export class PlaylistSelectorPageObject extends BasePageObject {
  public testId = "fmdPlaylistSelector";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private playlistSelectorElement(overrides: PlaylistSelectorRenderProps = {}) {
    return <PlaylistSelector {...defaultProps} {...overrides} />;
  }

  renderPlaylistSelector(
    overrides: PlaylistSelectorRenderProps = {},
  ): RenderResult {
    return render(this.playlistSelectorElement(overrides));
  }

  rerenderPlaylistSelector(
    rerender: RenderResult["rerender"],
    overrides: PlaylistSelectorRenderProps = {},
  ): void {
    rerender(this.playlistSelectorElement(overrides));
  }
}
