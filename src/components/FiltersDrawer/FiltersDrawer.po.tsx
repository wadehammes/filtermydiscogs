import { api } from "src/api/urls";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { PersistedFiltersState } from "src/types/filters.types";
import { definedProps } from "src/utils/definedProps";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { FiltersDrawer } from "./FiltersDrawer.component";

jest.mock("src/api/urls");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);

export type FiltersDrawerRenderProps = {
  isOpen?: boolean;
  onClose?: () => void;
  releases?: DiscogsRelease[];
  sessionFilters?: Partial<PersistedFiltersState>;
};

export class FiltersDrawerPageObject extends BasePageObject {
  public drawerTestId = "fmdBottomDrawer";
  public searchBarTestId = "fmdSearchBar";
  public onClose = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      new Error("Preferences request failed"),
    );
  }

  private filtersDrawerElement(overrides: FiltersDrawerRenderProps = {}) {
    const {
      isOpen = true,
      onClose,
      releases = [
        releaseFactory.withStyles(["Rock"], {
          basic_information: {
            ...releaseFactory.withDisplayDefaults().basic_information,
            year: 1999,
            formats: [{ name: "Vinyl", descriptions: ["LP"] }],
          },
        }),
      ],
      sessionFilters,
    } = overrides;

    return (
      <SeedCollectionFilters
        releases={releases}
        {...definedProps({ sessionFilters })}
      >
        <FiltersDrawer isOpen={isOpen} onClose={onClose ?? this.onClose} />
      </SeedCollectionFilters>
    );
  }

  renderFiltersDrawer(overrides: FiltersDrawerRenderProps = {}): RenderResult {
    return render(this.filtersDrawerElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }
}
