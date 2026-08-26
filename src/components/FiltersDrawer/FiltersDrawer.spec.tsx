import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { FiltersDrawerPageObject } from "src/components/FiltersDrawer/FiltersDrawer.po";
import { SortValues } from "src/constants/sortValues";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  clickFilterOption,
  openFilterCombobox,
} from "src/tests/filterControlTestHelpers";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { screen, waitFor } from "test-utils";

let po: FiltersDrawerPageObject;

describe("FiltersDrawer", () => {
  beforeEach(() => {
    localStorage.clear();
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

  it("resets all filters when Reset is pressed", async () => {
    const user = userEvent.setup();
    po.renderFiltersDrawer({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [1999],
        selectedFormats: ["Vinyl"],
        selectedSort: SortValues.DateAddedNew,
        styleOperator: "OR",
        searchQuery: "test search",
      },
    });

    const resetButton = screen.getByRole("button", {
      name: "Reset filters",
    });
    expect(resetButton).toBeEnabled();

    await user.click(resetButton);

    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");

    const saved = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}");
    expect(saved.selectedStyles).toEqual([]);
    expect(saved.selectedYears).toEqual([]);
    expect(saved.selectedFormats).toEqual([]);
    expect(saved.searchQuery).toBe("");
  });

  it("disables Reset when no filters are active", () => {
    po.renderFiltersDrawer();

    expect(
      screen.getByRole("button", { name: "Reset filters" }),
    ).toBeDisabled();
  });

  it("shows applied filter count in the drawer title and footer", () => {
    po.renderFiltersDrawer({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [1999],
        selectedFormats: [],
        selectedSort: SortValues.DateAddedNew,
        styleOperator: "OR",
        searchQuery: "",
      },
    });

    expect(
      screen.getByRole("heading", { name: "Filters (2)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 filters applied")).toBeInTheDocument();
  });

  it("clears a multi-select filter from its Clear control", async () => {
    const user = userEvent.setup();
    po.renderFiltersDrawer({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        selectedSort: SortValues.DateAddedNew,
        styleOperator: "OR",
        searchQuery: "",
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Clear Genre & Style" }),
    );

    const saved = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}");
    expect(saved.selectedStyles).toEqual([]);
  });

  it("opens the genre combobox with a search input", async () => {
    po.renderFiltersDrawer();

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Genre & Style" }),
      ).toBeEnabled();
    });

    await openFilterCombobox("Genre & Style");

    expect(
      screen.getByPlaceholderText("Search genre & style..."),
    ).toBeInTheDocument();
  });

  it("supports selecting multiple format types", async () => {
    po.renderFiltersDrawer({
      releases: [
        releaseFactory.withStyles(["Techno"], {
          basic_information: {
            ...releaseFactory.withDisplayDefaults().basic_information,
            formats: [
              { name: "Vinyl", descriptions: ['12"', "Test Pressing"] },
            ],
          },
        }),
        releaseFactory.withStyles(["House"], {
          basic_information: {
            ...releaseFactory.withDisplayDefaults().basic_information,
            formats: [{ name: "Vinyl", descriptions: ['12"', "White Label"] }],
          },
        }),
      ],
    });

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Format Type" }),
      ).toBeEnabled();
    });

    await openFilterCombobox("Format Type");
    await clickFilterOption("Test Pressing");

    await openFilterCombobox("Format Type");
    await clickFilterOption("White Label");

    expect(screen.getByText("Test Pressing")).toBeInTheDocument();
    expect(screen.getByText("White Label")).toBeInTheDocument();

    const saved = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}");
    expect(saved.selectedFormats).toEqual(["Test Pressing", "White Label"]);
  });
});
