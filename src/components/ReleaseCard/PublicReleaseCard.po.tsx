import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease, ReleaseCardProps } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { PublicReleaseCard } from "./PublicReleaseCard.component";

jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

export type PublicReleaseCardRenderProps = Partial<
  Omit<ReleaseCardProps, "release">
> & {
  release?: DiscogsRelease;
};

export class PublicReleaseCardPageObject extends BasePageObject {
  public testId = "fmdPublicReleaseCard";
  public onReleaseClick = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private publicReleaseCardElement(
    overrides: PublicReleaseCardRenderProps = {},
  ) {
    const { release, onReleaseClick, ...rest } = overrides;

    return (
      <PublicReleaseCard
        release={release ?? releaseFactory.withDisplayDefaults()}
        onReleaseClick={onReleaseClick ?? this.onReleaseClick}
        {...rest}
      />
    );
  }

  renderPublicReleaseCard(
    overrides: PublicReleaseCardRenderProps = {},
  ): RenderResult {
    return render(this.publicReleaseCardElement(overrides), {
      includeCrate: false,
    });
  }
}
