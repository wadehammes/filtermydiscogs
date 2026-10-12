import { api } from "src/api/urls";
import { CrateDrawer } from "src/components/CrateDrawer/CrateDrawer.component";
import releasesClientStyles from "src/components/ReleasesClient/ReleasesClient.module.css";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("Crate API request failed");

export class CrateDrawerPageObject extends BasePageObject {
  public testId = "fmdCrateDrawer";
  public mockApi = mockApi;
  public defaultCrates = crateWithCountFactory.defaultCrateSelectorCrates();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks(): void {
    jest.clearAllMocks();
    localStorage.clear();

    mockApiResponse(
      true,
      this.mockApi.crates,
      cratesResponseFactory.withCrates(this.defaultCrates),
      apiError,
    );

    this.mockApi.crate.mockImplementation(async (crateId: string) => {
      const crate = this.defaultCrates.find((entry) => entry.id === crateId);
      if (!crate) {
        throw new Error(`Crate not found: ${crateId}`);
      }

      const { releaseCount: _releaseCount, ...crateWithoutCount } = crate;
      return crateWithReleasesResponseFactory.withReleases(
        crateWithoutCount,
        [],
      );
    });
  }

  renderCrateDrawerInSidebar(desktop: boolean): RenderResult {
    setupMockMatchMedia({ desktop });

    return render(
      <div className={releasesClientStyles.sidebar}>
        <CrateDrawer isOpen />
      </div>,
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );
  }
}
