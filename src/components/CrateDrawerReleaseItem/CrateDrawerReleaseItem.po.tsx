import { CrateDrawerProvider } from "src/components/CrateDrawer/CrateDrawer.context";
import { CrateDrawerReleaseItem } from "src/components/CrateDrawerReleaseItem/CrateDrawerReleaseItem.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { ReleaseOpenPrefetchPageObject } from "src/tests/ReleaseOpenPrefetchPageObject.po";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");

export type CrateDrawerReleaseItemRenderProps = {
  release?: DiscogsRelease;
  onReleaseClick?: (instanceId: string) => void;
  onPackedChange?: jest.Mock;
  onRemove?: jest.Mock;
  packed?: boolean;
};

export class CrateDrawerReleaseItemPageObject extends ReleaseOpenPrefetchPageObject {
  public testId = "fmdCrateDrawerReleaseItem";
  public defaultRelease = releaseFactory.withTitle("Drawer Row Album", 249504, {
    instance_id: "drawer-row-instance",
  });

  private crateDrawerReleaseItemElement(
    overrides: CrateDrawerReleaseItemRenderProps = {},
  ) {
    const {
      release = this.defaultRelease,
      onReleaseClick,
      onPackedChange = jest.fn(),
      onRemove = jest.fn(),
      packed = false,
    } = overrides;

    return (
      <CrateDrawerProvider {...(onReleaseClick ? { onReleaseClick } : {})}>
        <CrateDrawerReleaseItem
          release={release}
          packed={packed}
          onPackedChange={onPackedChange}
          onRemove={onRemove}
          {...(onReleaseClick ? { onReleaseClick } : {})}
        />
      </CrateDrawerProvider>
    );
  }

  renderCrateDrawerReleaseItem(
    overrides: CrateDrawerReleaseItemRenderProps = {},
  ): RenderResult {
    return render(this.crateDrawerReleaseItemElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
