import type { RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  ReleaseTrackRowMenu,
  type ReleaseTrackRowMenuProps,
} from "./ReleaseTrackRowMenu.component";

export type ReleaseTrackRowMenuRenderProps = Partial<ReleaseTrackRowMenuProps>;

const defaultProps = {
  trackTitle: "Test track",
  canAddToQueue: true,
  canUnqueue: false,
  isQueued: false,
  hasUserYoutubeOverride: false,
  hasDefaultYoutubeEmbed: false,
  onAddToQueue: () => undefined,
  useMenuOverlayStack: false,
} satisfies ReleaseTrackRowMenuProps;

export class ReleaseTrackRowMenuPageObject extends BasePageObject {
  public testId = "fmdReleaseTrackRowMenu";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private ReleaseTrackRowMenuElement(
    overrides: ReleaseTrackRowMenuRenderProps = {},
  ): ReactElement {
    const props = { ...defaultProps, ...overrides };

    return (
      <OverlayStack>
        <ReleaseTrackRowMenu {...props} />
      </OverlayStack>
    );
  }

  renderReleaseTrackRowMenu(
    overrides: ReleaseTrackRowMenuRenderProps = {},
  ): RenderResult {
    return render(this.ReleaseTrackRowMenuElement(overrides));
  }

  rerenderReleaseTrackRowMenu(
    rerender: RenderResult["rerender"],
    overrides: ReleaseTrackRowMenuRenderProps = {},
  ): void {
    rerender(this.ReleaseTrackRowMenuElement(overrides));
  }
}
