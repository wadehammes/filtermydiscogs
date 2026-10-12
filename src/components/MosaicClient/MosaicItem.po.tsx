import MosaicItem from "src/components/MosaicClient/MosaicItem.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { ReleaseOpenPrefetchPageObject } from "src/tests/ReleaseOpenPrefetchPageObject.po";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");

export type MosaicItemRenderProps = {
  release?: DiscogsRelease;
  totalReleases?: number;
  onReleaseClick?: jest.Mock;
};

export class MosaicItemPageObject extends ReleaseOpenPrefetchPageObject {
  public testId = "fmdMosaicItem";

  private mosaicItemElement(overrides: MosaicItemRenderProps = {}) {
    const {
      release = releaseFactory.withTitle("Mosaic Album", 249504),
      totalReleases = 1,
      onReleaseClick = jest.fn(),
    } = overrides;

    return (
      <MosaicItem
        release={release}
        totalReleases={totalReleases}
        onReleaseClick={onReleaseClick}
      />
    );
  }

  renderMosaicItem(overrides: MosaicItemRenderProps = {}): RenderResult {
    return render(this.mosaicItemElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
