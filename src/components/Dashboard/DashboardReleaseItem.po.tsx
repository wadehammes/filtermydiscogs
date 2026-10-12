import { DashboardReleaseItem } from "src/components/Dashboard/DashboardReleaseItem.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { ReleaseOpenPrefetchPageObject } from "src/tests/ReleaseOpenPrefetchPageObject.po";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");

export type DashboardReleaseItemRenderProps = {
  release?: DiscogsRelease;
  onReleaseClick?: jest.Mock;
};

export class DashboardReleaseItemPageObject extends ReleaseOpenPrefetchPageObject {
  public testId = "fmdDashboardReleaseItem";

  private dashboardReleaseItemElement(
    overrides: DashboardReleaseItemRenderProps = {},
  ) {
    const {
      release = releaseFactory.withTitle("Dashboard Album", 249504),
      onReleaseClick = jest.fn(),
    } = overrides;

    return (
      <DashboardReleaseItem release={release} onReleaseClick={onReleaseClick} />
    );
  }

  renderDashboardReleaseItem(
    overrides: DashboardReleaseItemRenderProps = {},
  ): RenderResult {
    return render(this.dashboardReleaseItemElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
