import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  PlaybackSkipHelpDialog,
  PlaybackSkipHelpDialogHost,
  type PlaybackSkipHelpDialogProps,
  PlaybackSkipHelpToastTrigger,
} from "./PlaybackSkipHelpDialog.component";

export type PlaybackSkipHelpDialogRenderProps =
  Partial<PlaybackSkipHelpDialogProps>;

export class PlaybackSkipHelpDialogPageObject extends BasePageObject {
  public testId = "fmdPlaybackSkipHelpDialog";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private PlaybackSkipHelpDialogElement(
    overrides: PlaybackSkipHelpDialogRenderProps = {},
  ) {
    return (
      <PlaybackSkipHelpDialog open onClose={() => undefined} {...overrides} />
    );
  }

  renderDialog(
    overrides: PlaybackSkipHelpDialogRenderProps = {},
  ): RenderResult {
    return render(this.PlaybackSkipHelpDialogElement(overrides));
  }

  renderHostWithTrigger(): RenderResult {
    return render(
      <>
        <PlaybackSkipHelpDialogHost />
        <PlaybackSkipHelpToastTrigger />
      </>,
    );
  }

  renderToastTrigger(): RenderResult {
    return render(<PlaybackSkipHelpToastTrigger />);
  }
}
