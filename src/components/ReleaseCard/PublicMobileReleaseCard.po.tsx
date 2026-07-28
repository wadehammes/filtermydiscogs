import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease, ReleaseCardProps } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { PublicMobileReleaseCard } from "./PublicMobileReleaseCard.component";

jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

export type PublicMobileReleaseCardRenderProps = Partial<
  Omit<ReleaseCardProps, "release">
> & {
  release?: DiscogsRelease;
};

export class PublicMobileReleaseCardPageObject extends BasePageObject {
  public testId = "fmdPublicMobileReleaseCard";
  public onReleaseClick = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private publicMobileReleaseCardElement(
    overrides: PublicMobileReleaseCardRenderProps = {},
  ) {
    const { release, onReleaseClick, ...rest } = overrides;

    return (
      <PublicMobileReleaseCard
        release={release ?? releaseFactory.withDisplayDefaults()}
        onReleaseClick={onReleaseClick ?? this.onReleaseClick}
        {...rest}
      />
    );
  }

  renderPublicMobileReleaseCard(
    overrides: PublicMobileReleaseCardRenderProps = {},
  ): RenderResult {
    return render(this.publicMobileReleaseCardElement(overrides), {
      includeCrate: false,
    });
  }
}
