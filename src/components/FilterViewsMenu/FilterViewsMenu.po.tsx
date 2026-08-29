import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { PersistedFiltersState } from "src/types/filters.types";
import { definedProps } from "src/utils/definedProps";
import { render } from "test-utils";
import {
  FilterViewsMenu,
  type FilterViewsMenuProps,
} from "./FilterViewsMenu.component";

export type FilterViewsMenuRenderProps = FilterViewsMenuProps & {
  sessionFilters?: Partial<PersistedFiltersState>;
};

export class FilterViewsMenuPageObject extends BasePageObject {
  public testId = "fmdFilterViewsMenu";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
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
        <FilterViewsMenu {...overrides} />
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
