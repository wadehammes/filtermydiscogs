import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { FiltersDrawerPageObject } from "src/components/FiltersDrawer/FiltersDrawer.po";
import { SortValues } from "src/constants/sortValues";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import {
  clickFilterOption,
  expectFilterPopupAboveBottomDrawer,
  expectFilterPopupAbovePlaybackDock,
  openFilterCombobox,
  openFilterSelect,
} from "src/tests/filterControlTestHelpers";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import {
  defaultPersistedFilters,
  FILTERS_STORAGE_KEY,
} from "src/utils/filtersStorage";
import { createFilterView } from "src/utils/filterViews";
import { screen, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

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
    expect(screen.getByTestId("fmdFilterViewsMenu")).toBeInTheDocument();
  });

  it("opens the Views menu from the filters drawer", async () => {
    const user = userEvent.setup();

    po.renderFiltersDrawer();

    await user.click(
      screen.getByRole("button", { name: "Views and filter actions" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Save current view…" }),
    ).toBeInTheDocument();
  });

  it("calls onClose when the close button is pressed", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();

    po.renderFiltersDrawer({ onClose });

    await user.click(screen.getByRole("button", { name: "Close filters" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("resets all filters from the Views menu", async () => {
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

    await user.click(
      screen.getByRole("button", { name: "Views and filter actions" }),
    );

    const resetItem = await screen.findByRole("menuitem", {
      name: "Reset filters",
    });

    await user.click(resetItem);

    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");

    const saved = JSON.parse(localStorage.getItem(FILTERS_STORAGE_KEY) ?? "{}");
    expect(saved.selectedStyles).toEqual([]);
    expect(saved.selectedYears).toEqual([]);
    expect(saved.selectedFormats).toEqual([]);
    expect(saved.searchQuery).toBe("");
  });

  it("disables Reset in the Views menu when no filters are active", async () => {
    const user = userEvent.setup();
    po.renderFiltersDrawer();

    await user.click(
      screen.getByRole("button", { name: "Views and filter actions" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Reset filters" }),
    ).toHaveAttribute("data-disabled", "");
    expect(
      screen.getByRole("menuitem", { name: "Save current view…" }),
    ).toHaveAttribute("data-disabled", "");
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

  it("applies a saved view from the Views menu", async () => {
    const technoFilters = {
      ...defaultPersistedFilters,
      selectedStyles: ["Techno"],
      selectedSort: SortValues.AZArtist,
    };
    const savedView = createFilterView("Techno", technoFilters);

    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.asApiResponse({
        filterViews: [savedView],
      }),
      new Error("Preferences request failed"),
    );

    const user = userEvent.setup();
    po.renderFiltersDrawer();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Views and filter actions" }),
      ).toBeEnabled();
    });

    await user.click(
      screen.getByRole("button", { name: "Views and filter actions" }),
    );
    await user.click(
      await screen.findByRole("menuitemradio", { name: "Techno" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Views, Techno selected" }),
      ).toBeInTheDocument();
    });
  });

  it("disables Save current view when filters match an existing saved view", async () => {
    const technoFilters = {
      ...defaultPersistedFilters,
      selectedStyles: ["Techno"],
      selectedSort: SortValues.AZArtist,
    };
    const savedView = createFilterView("Techno", technoFilters);

    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.asApiResponse({
        filterViews: [savedView],
      }),
      new Error("Preferences request failed"),
    );

    const user = userEvent.setup();
    po.renderFiltersDrawer({
      sessionFilters: technoFilters,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Views, Techno selected" }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Views, Techno selected" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Save current view…" }),
    ).toHaveAttribute("data-disabled", "");
    expect(
      screen.getByRole("menuitem", { name: "Reset filters" }),
    ).not.toHaveAttribute("data-disabled", "");
  });

  it("clears filters when clicking the active saved view again", async () => {
    const technoFilters = {
      ...defaultPersistedFilters,
      selectedStyles: ["Techno"],
    };
    const savedView = createFilterView("Techno", technoFilters);

    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.asApiResponse({
        filterViews: [savedView],
      }),
      new Error("Preferences request failed"),
    );

    const user = userEvent.setup();
    po.renderFiltersDrawer({
      sessionFilters: technoFilters,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Views, Techno selected" }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Views, Techno selected" }),
    );
    await user.click(
      await screen.findByRole("menuitemradio", { name: "Techno" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Views and filter actions" }),
      ).toBeInTheDocument();
    });
  });

  it("enables Save current view when filters differ from saved views", async () => {
    const savedView = createFilterView("Techno", {
      ...defaultPersistedFilters,
      selectedStyles: ["Techno"],
    });

    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.asApiResponse({
        filterViews: [savedView],
      }),
      new Error("Preferences request failed"),
    );

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
      screen.getByRole("button", { name: "Views and filter actions" }),
    );

    expect(
      await screen.findByRole("menuitem", { name: "Save current view…" }),
    ).not.toHaveAttribute("data-disabled", "");
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

  it("portals combobox popups above the playback dock from the filters drawer", async () => {
    po.renderFiltersDrawer();

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Genre & Style" }),
      ).toBeEnabled();
    });

    await openFilterCombobox("Genre & Style");

    const popup = screen.getByRole("dialog", { name: "Genre & Style" });
    expectFilterPopupAboveBottomDrawer(popup);
    expectFilterPopupAbovePlaybackDock(popup);
  });

  it("portals select popups into the bottom drawer overlay stack", async () => {
    po.renderFiltersDrawer();

    await openFilterSelect("Sort by");

    expectFilterPopupAboveBottomDrawer(
      screen.getByRole("listbox", { name: "Sort by" }),
    );
  });

  it("portals the Views menu with scrollable popup chrome", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderFiltersDrawer();

    await user.click(
      screen.getByRole("button", { name: "Views and filter actions" }),
    );

    const saveItem = await screen.findByRole("menuitem", {
      hidden: true,
      name: "Save current view…",
    });
    const popup = saveItem.closest('[role="menu"]');
    expect(popup).toBeTruthy();
    expect((popup as HTMLElement).className).toMatch(/popupScroll/);
    expect((popup as HTMLElement).className).toMatch(/drawerMenuPopup/);

    const resetItem = screen.getByRole("menuitem", {
      hidden: true,
      name: "Reset filters",
    });
    expect(resetItem.className).toMatch(/itemNeutral/);
  });

  it("portals the Views menu into the bottom drawer overlay stack", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderFiltersDrawer();

    await user.click(
      screen.getByRole("button", { name: "Views and filter actions" }),
    );

    expectFilterPopupAboveBottomDrawer(
      await screen.findByRole("menuitem", { name: "Save current view…" }),
    );
  });

  it("closes a select dropdown when clicking its trigger again", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    po.renderFiltersDrawer();

    await openFilterSelect("Sort by");

    await user.click(screen.getByRole("combobox", { name: "Sort by" }));

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Sort by" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });
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
