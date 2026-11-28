import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { api } from "src/api/urls";
import { collectionCommandIntentFactory } from "src/tests/factories/CollectionCommandIntent.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { FacetOptions } from "src/types/filters.types";
import { sanitizeCollectionCommandIntent } from "src/utils/collectionCommandIntent";
import { computeFacetOptions } from "src/utils/computeFacetOptions";
import { inactiveFilterSelectionDefaults } from "src/utils/filtersStorage";
import { act, renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls");

const mockSaveViewFromFilters = jest.fn(() => true);

jest.mock("src/hooks/useFilterViews.hook", () => ({
  useFilterViews: () => ({
    saveViewFromFilters: mockSaveViewFromFilters,
    canAddView: true,
  }),
}));

jest.mock("src/utils/toast", () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockFiltersDispatch = jest.fn();

let mockAllReleases: DiscogsRelease[] = [];
let mockFacetOptions: FacetOptions = {
  availableStyles: ["Techno"],
  availableYears: [2018],
  availableFormats: ["Vinyl"],
};

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useAllReleases: () => mockAllReleases,
  useFacetOptions: () => mockFacetOptions,
  useFiltersDispatch: () => mockFiltersDispatch,
}));

const mockApi = jest.mocked(api);

import { useCollectionCommandPalette } from "src/hooks/useCollectionCommandPalette.hook";

const renderPaletteHook = () =>
  renderFeatureHook(() => useCollectionCommandPalette(), {
    authInitialState: testAuthenticatedAuthState,
    includeCollectionSync: false,
  });

describe("useCollectionCommandPalette", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(mockApi, {
      interpretCollectionCommand: jest.fn(),
      userPreferences: jest.fn(),
      addReleaseToCrate: jest.fn(),
    });
    mockAllReleases = releaseFactory.buildList(3);
    mockFacetOptions = {
      availableStyles: ["Techno"],
      availableYears: [2018],
      availableFormats: ["Vinyl"],
    };
    mockApiResponse(
      true,
      mockApi.userPreferences,
      userPreferencesFactory.asApiResponse(),
      new Error("preferences failed"),
    );
    mockSaveViewFromFilters.mockReturnValue(true);
  });

  it("when interpret succeeds then query changes, clears preview", async () => {
    const intent = collectionCommandIntentFactory.withStyles(["Techno"], {
      selectedYears: [2018],
    });
    mockApiResponse(
      true,
      mockApi.interpretCollectionCommand,
      { intent },
      new Error("interpret failed"),
    );

    const { result } = renderPaletteHook();

    act(() => {
      result.current.setQuery("techno from 2018");
    });

    act(() => {
      result.current.runInterpret();
    });

    await waitFor(() => {
      expect(result.current.previewFilters).not.toBeNull();
    });

    act(() => {
      result.current.setQuery("techno from 2019");
    });

    await waitFor(() => {
      expect(result.current.previewFilters).toBeNull();
    });
  });

  it("when startOver is called, clears query and preview without closing", async () => {
    const intent = collectionCommandIntentFactory.withStyles(["Techno"], {
      selectedYears: [2018],
    });
    mockApiResponse(
      true,
      mockApi.interpretCollectionCommand,
      { intent },
      new Error("interpret failed"),
    );

    const { result } = renderPaletteHook();

    act(() => {
      result.current.openPalette();
    });

    act(() => {
      result.current.setQuery("techno from 2018");
    });

    act(() => {
      result.current.runInterpret();
    });

    await waitFor(() => {
      expect(result.current.previewFilters).not.toBeNull();
    });

    act(() => {
      result.current.startOver();
    });

    await waitFor(() => {
      expect(result.current.query).toBe("");
      expect(result.current.previewFilters).toBeNull();
      expect(result.current.open).toBe(true);
    });
  });

  it("when openPalette is called, surfaces complex multi-style example prompts", () => {
    mockAllReleases = [];
    mockFacetOptions = {
      availableStyles: ["House", "Disco", "Techno", "Soul"],
      availableYears: [2012, 2014, 2016],
      availableFormats: ["Vinyl", "CD"],
    };

    const { result } = renderPaletteHook();

    act(() => {
      result.current.openPalette();
    });

    expect(result.current.examplePrompts).toHaveLength(3);
    expect(result.current.examplePrompts[0]).toMatch(
      /Show me .+ AND .+ releases from the \d{4}s/i,
    );
  });

  it("when runInterpretForPrompt is called, sets query and calls interpret API", async () => {
    const intent = collectionCommandIntentFactory.withStyles([
      "House",
      "Disco",
    ]);
    mockApiResponse(
      true,
      mockApi.interpretCollectionCommand,
      { intent },
      new Error("interpret failed"),
    );

    const { result } = renderPaletteHook();

    act(() => {
      result.current.runInterpretForPrompt(
        "  Show me House AND Disco releases from the 2010s  ",
      );
    });

    await waitFor(() => {
      expect(mockApi.interpretCollectionCommand).toHaveBeenCalledWith(
        "Show me House AND Disco releases from the 2010s",
      );
      expect(result.current.query).toBe(
        "Show me House AND Disco releases from the 2010s",
      );
    });
  });

  it("when collection releases include exclude tags, sanitize keeps excludedStyles for palette preview", () => {
    const releases = [
      releaseFactory.withStyles(["Deep House", "House"], {
        basic_information: { year: 2018 },
      }),
    ];
    const intent = collectionCommandIntentFactory.build({
      selectedStyles: ["Deep House"],
      excludedStyles: ["House"],
    });
    const facets = computeFacetOptions({
      releases,
      ...inactiveFilterSelectionDefaults,
    });
    const { filters } = sanitizeCollectionCommandIntent(intent, facets);

    expect(filters.excludedStyles).toEqual(["House"]);
    expect(filters.selectedStyles).toEqual(["Deep House"]);
  });

  it("when runInterpret succeeds, calls the interpret API with a trimmed prompt", async () => {
    const intent = collectionCommandIntentFactory.withStyles(["Techno"]);
    mockApiResponse(
      true,
      mockApi.interpretCollectionCommand,
      { intent },
      new Error("interpret failed"),
    );

    const { result } = renderPaletteHook();

    act(() => {
      result.current.setQuery("  techno  ");
    });

    act(() => {
      result.current.runInterpret();
    });

    await waitFor(() => {
      expect(mockApi.interpretCollectionCommand).toHaveBeenCalledWith("techno");
      expect(result.current.previewFilters).not.toBeNull();
    });
  });
});
