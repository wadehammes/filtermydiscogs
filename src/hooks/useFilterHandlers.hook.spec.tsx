import { beforeEach, describe, expect, it } from "@jest/globals";
import { useAtomValue } from "jotai";
import { trackEvent } from "src/analytics/analytics";
import {
  selectedFormatsAtom,
  selectedSortAtom,
  selectedStylesAtom,
  selectedYearsAtom,
  styleOperatorAtom,
} from "src/atoms/filters.atoms";
import { useFilterHandlers } from "src/hooks/useFilterHandlers.hook";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { SeedCollectionFilters } from "src/tests/utils/seedCollectionFilters";
import { act, renderFeatureHook } from "test-utils";

jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

const mockTrackEvent = jest.mocked(trackEvent);

describe("useFilterHandlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates selected styles and tracks analytics", () => {
    const releases = [
      releaseFactory.withStyles(["Rock"]),
      releaseFactory.withStyles(["Jazz"]),
    ];

    const { result } = renderFeatureHook(
      () => {
        const handlers = useFilterHandlers("test_filters");
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
    expect(mockTrackEvent).toHaveBeenCalledWith(
      "releaseStyle",
      expect.objectContaining({
        category: "test_filters",
        value: "Rock",
      }),
    );
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
        const handlers = useFilterHandlers("test_filters");
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
        const handlers = useFilterHandlers("test_filters");
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
        const handlers = useFilterHandlers("test_filters");
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
    expect(mockTrackEvent).toHaveBeenCalledWith(
      "styleOperator",
      expect.objectContaining({
        value: "AND",
      }),
    );
  });
});
