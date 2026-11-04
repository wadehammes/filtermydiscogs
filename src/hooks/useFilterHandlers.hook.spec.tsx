import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue, useStore } from "jotai";
import {
  collectionFiltersActiveAtom,
  filtersDispatchAtom,
  formatOperatorAtom,
  selectedFormatsAtom,
  selectedSortAtom,
  selectedSortSecondaryAtom,
  selectedStylesAtom,
  selectedYearsAtom,
  sortedFilteredReleasesAtom,
  styleOperatorAtom,
  yearOperatorAtom,
} from "src/atoms/filters.atoms";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import { FiltersActionTypes } from "src/context/filters.context";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { act, renderFeatureHook } from "test-utils";

describe("useFilterHandlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates selected styles", () => {
    const releases = [
      releaseFactory.withStyles(["Rock"]),
      releaseFactory.withStyles(["Jazz"]),
    ];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const selectedStyles = useAtomValue(selectedStylesAtom);

        return { handlers, selectedStyles };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleStyleChange(["Rock"]);
    });

    expect(result.current.selectedStyles).toEqual(["Rock"]);
  });

  it("updates selected years from string values", () => {
    const releases = [
      releaseFactory.withDisplayDefaults({
        basic_information: {
          year: 1984,
        },
      }),
      releaseFactory.withDisplayDefaults({
        basic_information: {
          year: 1999,
        },
      }),
    ];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const selectedYears = useAtomValue(selectedYearsAtom);

        return { handlers, selectedYears };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleYearChange(["1984"]);
    });

    expect(result.current.selectedYears).toEqual([1984]);
  });

  it("sorts by primary then secondary tier", () => {
    const releases = [
      releaseFactory.withDateAdded("2020-01-02T00:00:00.000Z", {
        basic_information: {
          artists: [artistFactory.build({ name: "Zebra Band" })],
        },
      }),
      releaseFactory.withDateAdded("2020-01-01T00:00:00.000Z", {
        basic_information: {
          artists: [artistFactory.build({ name: "Beta Band" })],
        },
      }),
      releaseFactory.withDateAdded("2020-01-01T00:00:00.000Z", {
        basic_information: {
          artists: [artistFactory.build({ name: "Alpha Band" })],
        },
      }),
    ];

    const { result } = renderFeatureHook(
      () => {
        const store = useStore();
        const handlers = useFilterHandlers();

        return {
          store,
          handlers,
          sorted: useAtomValue(sortedFilteredReleasesAtom),
        };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.store.set(collectionFiltersActiveAtom, true);
      result.current.store.set(filtersDispatchAtom, {
        type: FiltersActionTypes.SetAllReleases,
        payload: releases,
      });
      result.current.handlers.handleSortChange(SortValues.AZArtist);
      result.current.handlers.handleSortSecondaryChange(
        SortValues.DateAddedOld,
      );
    });

    expect(
      result.current.sorted.map(
        (release) => release.basic_information.artists[0]?.name,
      ),
    ).toEqual(["Alpha Band", "Beta Band", "Zebra Band"]);
  });

  it("coerces Then by to None when it matches the primary sort", () => {
    const releases = [releaseFactory.withDisplayDefaults()];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const selectedSortSecondary = useAtomValue(selectedSortSecondaryAtom);

        return { handlers, selectedSortSecondary };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleSortChange(SortValues.AZArtist);
      result.current.handlers.handleSortSecondaryChange(SortValues.AZArtist);
    });

    expect(result.current.selectedSortSecondary).toBe(SortSecondaryValues.None);
  });

  it("updates secondary sort and clears it when primary matches", () => {
    const releases = [releaseFactory.withDisplayDefaults()];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const selectedSort = useAtomValue(selectedSortAtom);
        const selectedSortSecondary = useAtomValue(selectedSortSecondaryAtom);

        return { handlers, selectedSort, selectedSortSecondary };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleSortSecondaryChange(SortValues.AZTitle);
    });

    expect(result.current.selectedSortSecondary).toBe(SortValues.AZTitle);

    act(() => {
      result.current.handlers.handleSortChange(SortValues.AZTitle);
    });

    expect(result.current.selectedSort).toBe(SortValues.AZTitle);
    expect(result.current.selectedSortSecondary).toBe(SortSecondaryValues.None);
  });

  it("clears secondary sort when it is the opposite direction on the same field", () => {
    const releases = [releaseFactory.withDisplayDefaults()];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const selectedSortSecondary = useAtomValue(selectedSortSecondaryAtom);

        return { handlers, selectedSortSecondary };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleSortChange(SortValues.DateAddedNew);
      result.current.handlers.handleSortSecondaryChange(
        SortValues.DateAddedOld,
      );
    });

    expect(result.current.selectedSortSecondary).toBe(SortSecondaryValues.None);
  });

  it("updates selected formats and sort", () => {
    const releases = [releaseFactory.withNamedFormats(["Vinyl"])];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const selectedFormats = useAtomValue(selectedFormatsAtom);
        const selectedSort = useAtomValue(selectedSortAtom);

        return { handlers, selectedFormats, selectedSort };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleFormatChange(["Vinyl"]);
      result.current.handlers.handleSortChange(SortValues.AZArtist);
    });

    expect(result.current.selectedFormats).toEqual(["Vinyl"]);
    expect(result.current.selectedSort).toBe(SortValues.AZArtist);
  });

  it("updates the style operator when a valid value is selected", () => {
    const releases = [
      releaseFactory.withStyles(["Rock"]),
      releaseFactory.withStyles(["Jazz"]),
    ];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const styleOperator = useAtomValue(styleOperatorAtom);

        return { handlers, styleOperator };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleStyleOperatorChange("AND");
    });

    expect(result.current.styleOperator).toBe("AND");
  });

  it("updates the format operator when a valid value is selected", () => {
    const releases = [releaseFactory.withNamedFormats(["Vinyl", "CD"])];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const formatOperator = useAtomValue(formatOperatorAtom);

        return { handlers, formatOperator };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleFormatOperatorChange("NONE");
    });

    expect(result.current.formatOperator).toBe("NONE");
  });

  it("updates the year operator when a valid value is selected", () => {
    const releases = [
      releaseFactory.build({
        basic_information: basicInformationFactory.build({ year: 2020 }),
      }),
    ];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const yearOperator = useAtomValue(yearOperatorAtom);

        return { handlers, yearOperator };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleYearOperatorChange("NONE");
    });

    expect(result.current.yearOperator).toBe("NONE");
  });

  it("ignores invalid year operator values", () => {
    const releases = [
      releaseFactory.build({
        basic_information: basicInformationFactory.build({ year: 2020 }),
      }),
    ];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers();
        const yearOperator = useAtomValue(yearOperatorAtom);

        return { handlers, yearOperator };
      },
      {
        wrapper: ({ children }) => (
          <SeedCollectionFilters releases={releases}>
            {children}
          </SeedCollectionFilters>
        ),
      },
    );

    act(() => {
      result.current.handlers.handleYearOperatorChange("AND");
    });

    expect(result.current.yearOperator).toBe("OR");
  });
});
