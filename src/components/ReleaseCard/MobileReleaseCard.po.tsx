import { ReleaseCardPageObject } from "src/components/ReleaseCard/ReleaseCard.po";
import type { BasePageObjectProps } from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { ReleasePlaybackTestTree } from "src/tests/utils/releasePlaybackTestTree";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease, ReleaseCardProps } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { MobileReleaseCard } from "./MobileReleaseCard.component";

export type MobileReleaseCardRenderProps = Partial<
  Omit<ReleaseCardProps, "release">
> & {
  release?: DiscogsRelease;
};

export class MobileReleaseCardPageObject extends ReleaseCardPageObject {
  public override testId = "fmdMobileReleaseCard";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  private mobileReleaseCardElement(
    overrides: MobileReleaseCardRenderProps = {},
  ) {
    const { release, inActiveCrate, ...rest } = overrides;
    const resolvedRelease = release ?? releaseFactory.withDisplayDefaults();

    return (
      <ReleasePlaybackTestTree>
        <MobileReleaseCard
          release={resolvedRelease}
          inActiveCrate={this.resolveInActiveCrate(
            resolvedRelease,
            inActiveCrate,
          )}
          {...rest}
        />
      </ReleasePlaybackTestTree>
    );
  }

  renderMobileReleaseCard(
    overrides: MobileReleaseCardRenderProps = {},
  ): RenderResult {
    return render(this.mobileReleaseCardElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
