import { beforeEach, describe, expect, it } from "@jest/globals";
import { StickyHeaderBarPageObject } from "src/components/StickyHeaderBar/StickyHeaderBar.po";
import { SortValues } from "src/constants/sortValues";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  expectFilterPopupAbovePlaybackDock,
  openFilterCombobox,
  openFilterSelect,
  openFilterViewsMenu,
} from "src/tests/filterControlTestHelpers";
import { screen, waitFor } from "test-utils";

let po: StickyHeaderBarPageObject;

const filterBarReleases = [
  releaseFactory.withStyles(["Rock"], {
    basic_information: {
      ...releaseFactory.withDisplayDefaults().basic_information,
      year: 1999,
      formats: [{ name: "Vinyl", descriptions: ["LP"] }],
    },
  }),
];

const defaultSessionFilters = {
  selectedStyles: ["Rock"],
  selectedYears: [],
  selectedFormats: [],
  selectedSort: SortValues.DateAddedNew,
  styleOperator: "OR" as const,
  searchQuery: "",
};

describe("StickyHeaderBar", () => {
  beforeEach(() => {
    po = new StickyHeaderBarPageObject();
  });

  it("renders the desktop filters bar when the collection is ready", () => {
    po.renderStickyHeaderBar();

    expect(screen.getByTestId(po.searchBarTestId)).toBeInTheDocument();
    expect(
      screen.queryByTestId(po.filtersSkeletonTestId),
    ).not.toBeInTheDocument();
  });

  it("renders the filters skeleton while releases are still loading", () => {
    po.renderStickyHeaderBar({ allReleasesLoaded: false });

    expect(screen.getByTestId(po.filtersSkeletonTestId)).toBeInTheDocument();
    expect(screen.queryByTestId(po.searchBarTestId)).not.toBeInTheDocument();
  });

  it("hides filters when hideFilters is true", () => {
    po.renderStickyHeaderBar({ hideFilters: true });

    expect(screen.queryByTestId(po.searchBarTestId)).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(po.filtersSkeletonTestId),
    ).not.toBeInTheDocument();
  });

  it("renders nav only when part is nav", () => {
    po.renderStickyHeaderBar({ part: "nav" });

    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(screen.queryByTestId(po.searchBarTestId)).not.toBeInTheDocument();
  });

  it("renders filters only when part is filters", () => {
    po.renderStickyHeaderBar({ part: "filters" });

    expect(screen.getByTestId(po.searchBarTestId)).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("portals desktop filter combobox popups above the playback dock", async () => {
    po.renderStickyHeaderBar({ part: "filters", releases: filterBarReleases });

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Genre & Style" }),
      ).toBeEnabled();
    });

    for (const name of [
      "Genre & Style",
      "Format Type",
      "Release Year",
    ] as const) {
      await openFilterCombobox(name);

      expectFilterPopupAbovePlaybackDock(screen.getByRole("dialog", { name }));
    }
  });

  it("portals desktop filter select popups above the playback dock", async () => {
    po.renderStickyHeaderBar({
      part: "filters",
      releases: filterBarReleases,
      sessionFilters: defaultSessionFilters,
    });

    for (const name of ["Sort by", "Match"] as const) {
      await openFilterSelect(name);

      expectFilterPopupAbovePlaybackDock(screen.getByRole("listbox", { name }));
    }
  });

  it("portals the Views menu above the playback dock", async () => {
    po.renderStickyHeaderBar({ part: "filters", releases: filterBarReleases });

    await openFilterViewsMenu();

    expectFilterPopupAbovePlaybackDock(
      screen.getByRole("menuitem", {
        hidden: true,
        name: "Save current view…",
      }),
    );
  });
});
