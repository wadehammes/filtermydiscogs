import { beforeEach, describe, expect, it } from "@jest/globals";
import { SearchBar } from "src/components/SearchBar/SearchBar.component";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { render, screen } from "test-utils";

describe("SearchBar persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts with an empty search field when saved filters exist in localStorage", () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: [],
        selectedYears: [],
        selectedFormats: [],
        selectedSort: "DateAddedNew",
        styleOperator: "OR",
        searchQuery: "blue note",
      }),
    );

    render(<SearchBar />);

    expect(
      screen.getByPlaceholderText("Search your collection..."),
    ).toHaveValue("");
  });
});
