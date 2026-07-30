import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { FiltersDrawerPageObject } from "src/components/FiltersDrawer/FiltersDrawer.po";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { screen } from "test-utils";

let po: FiltersDrawerPageObject;

describe("FiltersDrawer", () => {
  beforeEach(() => {
    po = new FiltersDrawerPageObject();
  });

  it("renders search and filter sections when open with a loaded collection", () => {
    po.renderFiltersDrawer();

    expect(screen.getByTestId(po.drawerTestId)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Filters" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
    expect(screen.getByTestId(po.searchBarTestId)).toBeInTheDocument();
    expect(screen.getByText("Genre & Style")).toBeInTheDocument();
    expect(screen.getByText("Release Year")).toBeInTheDocument();
    expect(screen.getByText("Format Type")).toBeInTheDocument();
    expect(screen.getByText("Sort by")).toBeInTheDocument();
    expect(screen.getByText("Order")).toBeInTheDocument();
  });

  it("calls onClose when the close button is pressed", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    po.renderFiltersDrawer({ onClose });

    await user.click(screen.getByRole("button", { name: "Close filters" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("clears all filters when Clear All is pressed", async () => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedStyles: ["Rock"],
        selectedYears: [1999],
        selectedFormats: ["Vinyl"],
        selectedSort: "DateAddedNew",
        styleOperator: "OR",
        searchQuery: "test search",
      }),
    );

    const user = userEvent.setup();
    po.renderFiltersDrawer();

    const clearAllButton = screen.getByRole("button", {
      name: "Clear all filters",
    });
    expect(clearAllButton).toBeEnabled();

    await user.click(clearAllButton);

    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");

    const saved = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}");
    expect(saved.selectedStyles).toEqual([]);
    expect(saved.selectedYears).toEqual([]);
    expect(saved.selectedFormats).toEqual([]);
    expect(saved.searchQuery).toBe("");
  });

  it("disables Clear All when no filters are active", () => {
    po.renderFiltersDrawer();

    expect(
      screen.getByRole("button", { name: "Clear all filters" }),
    ).toBeDisabled();
  });
});
