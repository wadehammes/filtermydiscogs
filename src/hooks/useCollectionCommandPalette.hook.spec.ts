import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { api } from "src/api/urls";
import { collectionCommandIntentFactory } from "src/tests/factories/CollectionCommandIntent.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { FacetOptions } from "src/types/filters.types";
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
