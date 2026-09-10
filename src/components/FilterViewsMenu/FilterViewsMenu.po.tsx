import type { RenderResult } from "@testing-library/react";
import { api } from "src/api/urls";
import {
  FilterViewsMenu,
  type FilterViewsMenuProps,
} from "src/components/FilterViewsMenu/FilterViewsMenu.component";
import { OverlayStack } from "src/components/OverlayStack/OverlayStack.component";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { PersistedFiltersState } from "src/types/filters.types";
import { definedProps } from "src/utils/definedProps";
import { render } from "test-utils";

jest.mock("src/api/urls");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockApi = jest.mocked(api);

export type FilterViewsMenuRenderProps = FilterViewsMenuProps & {
  sessionFilters?: Partial<PersistedFiltersState>;
};

export class FilterViewsMenuPageObject extends BasePageObject {
  public testId = "fmdFilterViewsMenu";
  mockApi = mockApi;

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.resetAllMocks();
    localStorage.clear();
    setupMockMatchMedia({ desktop: true });
    setupDefaultCrateApiMocks(this.mockApi);
    mockApiResponse(
      true,
      this.mockApi.userPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      new Error("Preferences request failed"),
    );
    mockApiResponse(
      true,
      this.mockApi.updateUserPreferences,
      userPreferencesFactory.defaultsApiResponse(),
      new Error("Preferences update failed"),
    );
  }

  private FilterViewsMenuElement({
    sessionFilters,
    ...overrides
  }: FilterViewsMenuRenderProps = {}) {
    const releases = [
      releaseFactory.withStyles(["Rock"], {
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
          year: 1999,
          formats: [{ name: "Vinyl", descriptions: ["LP"] }],
        },
      }),
    ];

    return (
      <SeedCollectionFilters
        releases={releases}
        {...definedProps({ sessionFilters })}
      >
        <OverlayStack
          escapeStackingContext
          popoverZIndex="calc(var(--z-9-playback-dock) + 1)"
        >
          <FilterViewsMenu {...overrides} />
        </OverlayStack>
      </SeedCollectionFilters>
    );
  }

  renderFilterViewsMenu(
    overrides: FilterViewsMenuRenderProps = {},
  ): RenderResult {
    return render(this.FilterViewsMenuElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
      includeCollectionSync: false,
    });
  }

  rerenderFilterViewsMenu(
    rerender: RenderResult["rerender"],
    overrides: FilterViewsMenuRenderProps = {},
  ): void {
    rerender(this.FilterViewsMenuElement(overrides));
  }
}
