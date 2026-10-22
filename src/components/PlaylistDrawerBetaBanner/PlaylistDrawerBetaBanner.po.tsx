import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  PlaylistDrawerBetaBanner,
  type PlaylistDrawerBetaBannerProps,
} from "./PlaylistDrawerBetaBanner.component";

export type PlaylistDrawerBetaBannerRenderProps =
  Partial<PlaylistDrawerBetaBannerProps>;

export class PlaylistDrawerBetaBannerPageObject extends BasePageObject {
  public testId = "fmdPlaylistDrawerBetaBanner";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private playlistDrawerBetaBannerElement(
    overrides: PlaylistDrawerBetaBannerRenderProps = {},
  ) {
    return <PlaylistDrawerBetaBanner {...overrides} />;
  }

  renderPlaylistDrawerBetaBanner(
    overrides: PlaylistDrawerBetaBannerRenderProps = {},
  ): RenderResult {
    return render(this.playlistDrawerBetaBannerElement(overrides));
  }

  rerenderPlaylistDrawerBetaBanner(
    rerender: RenderResult["rerender"],
    overrides: PlaylistDrawerBetaBannerRenderProps = {},
  ): void {
    rerender(this.playlistDrawerBetaBannerElement(overrides));
  }
}
