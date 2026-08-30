import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue } from "jotai";
import {
  formatOperatorAtom,
  selectedFormatsAtom,
  selectedSortAtom,
  selectedStylesAtom,
  selectedYearsAtom,
  styleOperatorAtom,
  yearOperatorAtom,
} from "src/atoms/filters.atoms";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
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
          ...releaseFactory.withDisplayDefaults().basic_information,
          year: 1984,
        },
      }),
      releaseFactory.withDisplayDefaults({
        basic_information: {
          ...releaseFactory.withDisplayDefaults().basic_information,
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
      result.current.handlers.handleSortChange("ArtistAsc");
    });

    expect(result.current.selectedFormats).toEqual(["Vinyl"]);
    expect(result.current.selectedSort).toBe("ArtistAsc");
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
