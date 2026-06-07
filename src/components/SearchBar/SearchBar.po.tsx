import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { SearchBar } from "./SearchBar.component";

const mockSearchQuery = jest.fn(() => "");
const mockIsSearching = jest.fn(() => false);
export const mockFiltersDispatch = jest.fn();

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useFiltersDispatch: () => mockFiltersDispatch,
  useSearchQuery: () => mockSearchQuery(),
  useIsSearching: () => mockIsSearching(),
}));

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
    jest.resetAllMocks();
    mockSearchQuery.mockReturnValue(state.searchQuery ?? "");
    mockIsSearching.mockReturnValue(state.isSearching ?? false);
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
