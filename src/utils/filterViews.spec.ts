import { describe, expect, it } from "@jest/globals";
import { SortValues } from "src/constants/sortValues";
import { persistedFiltersFactory } from "src/tests/factories/UserPreferences.factory";
import { defaultPersistedFilters } from "src/utils/filtersStorage";
import {
  createFilterView,
  filterViewNameExists,
  findMatchingFilterView,
  formatFilterViewSummary,
  hasSaveableFilterViewFilters,
  isValidFilterViewName,
  isValidFilterViewsPatch,
  MAX_FILTER_VIEWS,
  normalizeFilterViewName,
  parseFilterViews,
  renameFilterView,
} from "src/utils/filterViews";

describe("filterViews", () => {
  it("validates view names", () => {
    expect(isValidFilterViewName("Sunday ambient")).toBe(true);
    expect(isValidFilterViewName("  ")).toBe(false);
    expect(isValidFilterViewName("a".repeat(41))).toBe(false);
    expect(normalizeFilterViewName("  Techno  ")).toBe("Techno");
  });

  it("parses stored views and rejects invalid payloads", () => {
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
      searchQuery: "blue",
    });
    const view = createFilterView("Rock picks", filters);

    expect(parseFilterViews([view])).toEqual([view]);
    expect(parseFilterViews([{ ...view, name: "" }])).toEqual([]);
    expect(parseFilterViews("invalid")).toEqual([]);
    expect(isValidFilterViewsPatch([view])).toBe(true);
    expect(isValidFilterViewsPatch([])).toBe(true);
    expect(
      isValidFilterViewsPatch(
        Array.from({ length: MAX_FILTER_VIEWS + 1 }, (_, index) =>
          createFilterView(`View ${index}`, filters),
        ),
      ),
    ).toBe(false);
  });

  it("finds a matching view from the current session filters", () => {
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Techno"],
      selectedSort: SortValues.AZArtist,
    });
    const views = [
      createFilterView("Other", defaultPersistedFilters),
      createFilterView("Techno", filters),
    ];

    expect(findMatchingFilterView(views, filters)?.name).toBe("Techno");
    expect(
      findMatchingFilterView(views, {
        ...filters,
        searchQuery: "changed",
      }),
    ).toBeNull();
  });

  it("matches views when multi-select values differ only by order", () => {
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Acid", "Deep House"],
    });
    const views = [createFilterView("Deep Acid", filters)];

    expect(
      findMatchingFilterView(views, {
        ...filters,
        selectedStyles: ["Deep House", "Acid"],
      })?.name,
    ).toBe("Deep Acid");
  });

  it("matches views when stored filter objects use a different key order", () => {
    const session = {
      ...defaultPersistedFilters,
      selectedStyles: ["Acid", "Deep House"],
    };
    const views = [
      createFilterView("Deep Acid", {
        searchQuery: "",
        yearOperator: "OR",
        formatOperator: "OR",
        styleOperator: "OR",
        selectedSort: session.selectedSort,
        selectedFormats: [],
        selectedYears: [],
        selectedStyles: ["Deep House", "Acid"],
      }),
    ];

    expect(findMatchingFilterView(views, session)?.name).toBe("Deep Acid");
  });

  it("formats saved view summaries for settings", () => {
    expect(formatFilterViewSummary(defaultPersistedFilters)).toBe(
      "Default filters",
    );
    expect(
      formatFilterViewSummary({
        ...defaultPersistedFilters,
        selectedStyles: ["Acid", "Deep House"],
        styleOperator: "OR",
      }),
    ).toBe("Genre & style: Acid, Deep House (ANY)");
    expect(
      formatFilterViewSummary({
        ...defaultPersistedFilters,
        searchQuery: "blue note",
        selectedFormats: ["Vinyl"],
        selectedYears: [1999],
        yearOperator: "NONE",
        selectedSort: SortValues.AZArtist,
      }),
    ).toBe(
      'Search: "blue note" · Format: Vinyl · Year: 1999 (NONE) · Sort: Artist (A-Z)',
    );
  });

  it("detects duplicate names and saveable filter state", () => {
    const view = createFilterView("Techno", defaultPersistedFilters);

    expect(hasSaveableFilterViewFilters(defaultPersistedFilters)).toBe(false);
    expect(
      hasSaveableFilterViewFilters({
        ...defaultPersistedFilters,
        selectedSort: SortValues.AZArtist,
      }),
    ).toBe(false);
    expect(
      hasSaveableFilterViewFilters(
        persistedFiltersFactory.build({ selectedStyles: ["Techno"] }),
      ),
    ).toBe(true);
    expect(filterViewNameExists([view], "techno")).toBe(true);
    expect(filterViewNameExists([view], "techno", view.id)).toBe(false);
  });

  it("renames a saved view and rejects invalid or duplicate names", () => {
    const techno = createFilterView("Techno", {
      ...defaultPersistedFilters,
      selectedStyles: ["Techno"],
    });
    const ambient = createFilterView("Ambient", {
      ...defaultPersistedFilters,
      selectedStyles: ["Ambient"],
    });
    const views = [techno, ambient];

    const renamed = renameFilterView(views, techno.id, "  Peak time  ");

    expect(renamed?.find((view) => view.id === techno.id)?.name).toBe(
      "Peak time",
    );
    expect(renameFilterView(views, techno.id, "Ambient")).toBeNull();
    expect(renameFilterView(views, techno.id, "Techno")).toEqual(views);
    expect(renameFilterView(views, "missing-id", "New name")).toBeNull();
    expect(renameFilterView(views, techno.id, "  ")).toBeNull();
  });
});
