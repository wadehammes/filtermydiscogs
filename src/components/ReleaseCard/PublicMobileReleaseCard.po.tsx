import { PublicMobileReleaseCard } from "src/components/ReleaseCard/PublicMobileReleaseCard.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { ReleaseOpenPrefetchPageObject } from "src/tests/ReleaseOpenPrefetchPageObject.po";
import type { DiscogsRelease, ReleaseCardProps } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

export type PublicMobileReleaseCardRenderProps = Partial<
  Omit<ReleaseCardProps, "release">
> & {
  release?: DiscogsRelease;
};

export class PublicMobileReleaseCardPageObject extends ReleaseOpenPrefetchPageObject {
  public testId = "fmdPublicMobileReleaseCard";
  public onReleaseClick = jest.fn();

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
      includeCollectionSync: false,
    });
  }
}
