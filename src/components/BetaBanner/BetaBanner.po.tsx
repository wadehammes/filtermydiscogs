import type { RenderResult } from "@testing-library/react";
import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import { BetaBanner, type BetaBannerProps } from "./BetaBanner.component";

jest.mock("src/lib/sentry/sentryInitOptions", () => ({
  ...jest.requireActual("src/lib/sentry/sentryInitOptions"),
  resolveSentryEnabled: jest.fn(),
}));

export type BetaBannerRenderProps = Partial<BetaBannerProps>;

export class BetaBannerPageObject extends BasePageObject {
  public testId = "fmdBetaBannerTest";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
    jest.mocked(resolveSentryEnabled).mockReturnValue(true);
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
