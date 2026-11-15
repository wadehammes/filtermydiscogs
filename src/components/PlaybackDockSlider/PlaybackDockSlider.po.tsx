import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  PlaybackDockSlider,
  type PlaybackDockSliderProps,
} from "./PlaybackDockSlider.component";

export type PlaybackDockSliderRenderProps = Pick<
  PlaybackDockSliderProps,
  | "ariaLabel"
  | "max"
  | "min"
  | "onValueChange"
  | "onValueCommitted"
  | "orientation"
  | "step"
  | "value"
  | "disabled"
  | "className"
  | "testId"
>;

export class PlaybackDockSliderPageObject extends BasePageObject {
  public testId = "fmdPlaybackDockSlider";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private playbackDockSliderElement(props: PlaybackDockSliderRenderProps) {
    return <PlaybackDockSlider {...props} />;
  }

  renderPlaybackDockSlider(props: PlaybackDockSliderRenderProps): RenderResult {
    return render(this.playbackDockSliderElement(props));
  }

  rerenderPlaybackDockSlider(
    rerender: RenderResult["rerender"],
    props: PlaybackDockSliderRenderProps,
  ): void {
    rerender(this.playbackDockSliderElement(props));
  }
}
