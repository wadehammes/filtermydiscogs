import type { RenderResult } from "@testing-library/react";
import {
  PublicSharedViewBanner,
  type PublicSharedViewBannerProps,
} from "src/components/PublicSharedViewBanner/PublicSharedViewBanner.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";

export type PublicSharedViewBannerRenderProps = PublicSharedViewBannerProps;

export class PublicSharedViewBannerPageObject extends BasePageObject {
  public testId = "fmdPublicSharedViewBanner";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private publicSharedViewBannerElement(
    overrides: PublicSharedViewBannerRenderProps = {
      kind: "playlist",
      username: "collector",
    },
  ) {
    return <PublicSharedViewBanner {...overrides} />;
  }

  renderPublicSharedViewBanner(
    overrides: PublicSharedViewBannerRenderProps = {
      kind: "playlist",
      username: "collector",
    },
  ): RenderResult {
    return render(this.publicSharedViewBannerElement(overrides));
  }

  rerenderPublicSharedViewBanner(
    rerender: RenderResult["rerender"],
    overrides: PublicSharedViewBannerRenderProps = {
      kind: "playlist",
      username: "collector",
    },
  ): void {
    rerender(this.publicSharedViewBannerElement(overrides));
  }
}
