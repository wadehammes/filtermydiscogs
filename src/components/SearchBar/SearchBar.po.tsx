import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import { render } from "test-utils";
import { SearchBar } from "./SearchBar.component";

const mockUseFilters = jest.fn();
export const mockFiltersDispatch = jest.fn();

jest.mock("src/context/filters.context", () => {
  return {
    FiltersActionTypes: {
      SetSearchQuery: "SET_SEARCH_QUERY",
      SetSearching: "SET_SEARCHING",
    },
    useFilters: () => mockUseFilters(),
  };
});

export type SearchBarRenderProps = {
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

export class SearchBarPageObject extends BasePageObject {
  public testId = "fmdSearchBar";
  public defaultPlaceholder = "Search your collection...";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.resetFiltersMock();
  }

  resetFiltersMock(
    state: { searchQuery?: string; isSearching?: boolean } = {},
  ) {
    jest.clearAllMocks();
    mockUseFilters.mockReturnValue({
      state: {
        searchQuery: state.searchQuery ?? "",
        isSearching: state.isSearching ?? false,
      },
      dispatch: mockFiltersDispatch,
    });
  }

  private searchBarElement(overrides: SearchBarRenderProps = {}) {
    return <SearchBar {...overrides} />;
  }

  renderSearchBar(overrides: SearchBarRenderProps = {}): RenderResult {
    return render(this.searchBarElement(overrides));
  }

  rerenderSearchBar(
    rerender: RenderResult["rerender"],
    overrides: SearchBarRenderProps = {},
  ): void {
    rerender(this.searchBarElement(overrides));
  }
}
