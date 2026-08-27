import { api } from "src/api/urls";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { StickyHeaderBar } from "./StickyHeaderBar.component";

jest.mock("src/api/urls");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);

export type StickyHeaderBarRenderProps = {
  allReleasesLoaded?: boolean;
  hideFilters?: boolean;
  currentPage?: string;
  releases?: DiscogsRelease[];
};

export class StickyHeaderBarPageObject extends BasePageObject {
  public searchBarTestId = "fmdSearchBar";
  public filtersSkeletonTestId = "fmdFiltersBarSkeleton";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
  }

  private stickyHeaderBarElement(overrides: StickyHeaderBarRenderProps = {}) {
    const {
      allReleasesLoaded = true,
      hideFilters = false,
      currentPage = "releases",
      releases = [releaseFactory.withDisplayDefaults()],
    } = overrides;

    return (
      <SeedCollectionFilters releases={releases}>
        <StickyHeaderBar
          allReleasesLoaded={allReleasesLoaded}
          hideFilters={hideFilters}
          currentPage={currentPage}
        />
      </SeedCollectionFilters>
    );
  }

  renderStickyHeaderBar(
    overrides: StickyHeaderBarRenderProps = {},
  ): RenderResult {
    return render(this.stickyHeaderBarElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
