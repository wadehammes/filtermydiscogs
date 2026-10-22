import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { BetaBanner, type BetaBannerProps } from "./BetaBanner.component";

export type BetaBannerRenderProps = Partial<BetaBannerProps>;

export class BetaBannerPageObject extends BasePageObject {
  public testId = "fmdBetaBannerTest";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private betaBannerElement(overrides: BetaBannerRenderProps = {}) {
    return (
      <BetaBanner
        bannerClassName="beta-banner-test-shell"
        leading="Feature is in"
        testId={this.testId}
        {...overrides}
      />
    );
  }

  renderBetaBanner(overrides: BetaBannerRenderProps = {}): RenderResult {
    return render(this.betaBannerElement(overrides));
  }
}
