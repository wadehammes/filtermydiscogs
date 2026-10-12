import { PublicReleaseCard } from "src/components/ReleaseCard/PublicReleaseCard.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { ReleaseOpenPrefetchPageObject } from "src/tests/ReleaseOpenPrefetchPageObject.po";
import type { DiscogsRelease, ReleaseCardProps } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

export type PublicReleaseCardRenderProps = Partial<
  Omit<ReleaseCardProps, "release">
> & {
  release?: DiscogsRelease;
};

export class PublicReleaseCardPageObject extends ReleaseOpenPrefetchPageObject {
  public testId = "fmdPublicReleaseCard";
  public onReleaseClick = jest.fn();

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
      includeCollectionSync: false,
    });
  }
}
