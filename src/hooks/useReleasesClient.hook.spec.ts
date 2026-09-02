import { beforeEach, describe, expect, it } from "@jest/globals";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { api } from "src/api/urls";
import { SortValues } from "src/constants/sortValues";
import { VIEW_STATE_STORAGE_KEY } from "src/constants/storageKeys";
import { FiltersActionTypes } from "src/context/filters.context";
import { useFiltersDispatch } from "src/hooks/useFilterAtoms.hook";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import {
  type IntersectionObserverMockControls,
  setupIntersectionObserverMock,
} from "src/tests/mocks/mockIntersectionObserver.mock";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { act, renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/urls", () => ({
  api: {
    discogsCollection: jest.fn(),
    updateUserPreferences: jest.fn(),
  },
}));

const mockFetchDiscogsCollection = jest.mocked(api.discogsCollection);
const mockUpdateUserPreferences = jest.mocked(api.updateUserPreferences);
const mockUseRouter = jest.mocked(useRouter);
const mockUsePathname = jest.mocked(usePathname);
const mockUseSearchParams = jest.mocked(useSearchParams);

const INITIAL_VISIBLE_RELEASES = 100;
const VISIBLE_BATCH_SIZE = 100;

let intersectionObserver: IntersectionObserverMockControls;

const applyUrl = (url: string) => {
  const queryIndex = url.indexOf("?");

  mockUseSearchParams.mockReturnValue(
    (queryIndex >= 0
      ? new URLSearchParams(url.slice(queryIndex + 1))
      : new URLSearchParams()) as ReturnType<typeof useSearchParams>,
  );
};

const buildSinglePageCollection = (
  releases: ReturnType<typeof releaseFactory.buildList>,
) => {
  const page = collectionFactory.build(
    { releases },
    { page: 1, totalPages: 1, releaseCount: releases.length },
  );
  page.pagination.urls.next = "";
  return page;
};

const useReleasesClientHarness = (scrollElement: HTMLElement | null = null) => {
  const client = useReleasesClient({ scrollElement });
  const filtersDispatch = useFiltersDispatch();

  return {
    ...client,
    filtersDispatch,
  };
};

const triggerSentinelIntersection = (
  infiniteScrollRef: (node?: Element | null) => void,
) => {
  const sentinel = document.createElement("div");
  act(() => {
    infiniteScrollRef(sentinel);
  });
  act(() => {
    intersectionObserver.triggerIntersection(sentinel, true);
  });
};

describe("useReleasesClient", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockUpdateUserPreferences.mockResolvedValue(
      userPreferencesFactory.defaultsApiResponse(),
    );
    intersectionObserver = setupIntersectionObserverMock();
    setupMockMatchMedia({ desktop: true });
    mockUsePathname.mockReturnValue("/releases");
    applyUrl("/releases");
    mockUseRouter.mockReturnValue(
      createMockAppRouter({
        push: jest.fn((url: string) => {
          applyUrl(url);
        }),
        replace: jest.fn((url: string) => {
          applyUrl(url);
        }),
      }),
    );
  });

  it("loads releases and tracks selected release modal state", async () => {
    const releases = releaseFactory.buildList(2);
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releases),
      new Error("fail"),
    );

    const { result, rerender } = renderFeatureHook(() => useReleasesClient(), {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(result.current.releaseCount).toBe(2);
    });

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    rerender();

    await waitFor(() => {
      expect(result.current.selectedReleaseId).toBe(
        String(releases[0]?.instance_id),
      );
    });
    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );

    act(() => {
      result.current.handleCloseModal();
    });

    rerender();

    await waitFor(() => {
      expect(result.current.selectedReleaseId).toBeNull();
    });
    expect(result.current.selectedRelease).toBeNull();
  });

  it("switches from list to card view on mobile", async () => {
    localStorage.setItem(
      VIEW_STATE_STORAGE_KEY,
      JSON.stringify({ currentView: "list", previousView: "card" }),
    );
    setupMockMatchMedia({ desktop: false });

    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releaseFactory.buildList(1)),
      new Error("fail"),
    );

    const { result } = renderFeatureHook(() => useReleasesClient(), {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(result.current.currentView).toBe("card");
    });
  });

  it("caps visible releases until the scroll sentinel expands the window", async () => {
    const releases = releaseFactory.buildList(150);
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releases),
      new Error("fail"),
    );

    const { result } = renderFeatureHook(() => useReleasesClient(), {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(result.current.releaseCount).toBe(150);
    });

    expect(result.current.visibleReleases).toHaveLength(
      INITIAL_VISIBLE_RELEASES,
    );
  });

  it("exits random mode when switching to card view", async () => {
    const releases = releaseFactory.buildList(3);
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releases),
      new Error("fail"),
    );

    const { result } = renderFeatureHook(() => useReleasesClient(), {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(result.current.releaseCount).toBe(3);
    });

    act(() => {
      result.current.handleViewChange("random");
    });

    await waitFor(() => {
      expect(result.current.isRandomMode).toBe(true);
    });

    act(() => {
      result.current.handleViewChange("card");
    });

    await waitFor(() => {
      expect(result.current.isRandomMode).toBe(false);
      expect(result.current.currentView).toBe("card");
    });
  });
});

describe("useReleasesClient infinite scroll", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockUpdateUserPreferences.mockResolvedValue(
      userPreferencesFactory.defaultsApiResponse(),
    );
    intersectionObserver = setupIntersectionObserverMock();
    setupMockMatchMedia({ desktop: true });
    mockUsePathname.mockReturnValue("/releases");
    applyUrl("/releases");
    mockUseRouter.mockReturnValue(
      createMockAppRouter({
        push: jest.fn((url: string) => {
          applyUrl(url);
        }),
        replace: jest.fn((url: string) => {
          applyUrl(url);
        }),
      }),
    );
  });

  it("observes the provided scroll container instead of playback context", async () => {
    const scrollElement = document.createElement("div");
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releaseFactory.buildList(1)),
      new Error("fail"),
    );

    const { result } = renderFeatureHook(
      () => useReleasesClient({ scrollElement }),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    act(() => {
      result.current.infiniteScrollRef(document.createElement("div"));
    });

    await waitFor(() => {
      expect(intersectionObserver.getLastObserverRoot()).toBe(scrollElement);
    });
  });

  it("does not observe the viewport when ReleasesClient passes the scroll container", async () => {
    const scrollElement = document.createElement("div");
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releaseFactory.buildList(120)),
      new Error("fail"),
    );

    const { result } = renderFeatureHook(
      () => useReleasesClient({ scrollElement }),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    act(() => {
      result.current.infiniteScrollRef(document.createElement("div"));
    });

    await waitFor(() => {
      expect(intersectionObserver.getLastObserverRoot()).toBe(scrollElement);
    });
    expect(intersectionObserver.getLastObserverRoot()).not.toBeNull();
  });

  it("expands the visible release window when the sentinel enters view", async () => {
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releaseFactory.buildList(250)),
      new Error("fail"),
    );

    const { result, rerender } = renderFeatureHook(
      () => useReleasesClientHarness(document.createElement("div")),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      expect(result.current.releaseCount).toBe(250);
    });
    expect(result.current.visibleReleases).toHaveLength(
      INITIAL_VISIBLE_RELEASES,
    );

    triggerSentinelIntersection(result.current.infiniteScrollRef);
    rerender();

    await waitFor(() => {
      expect(result.current.visibleReleases).toHaveLength(
        INITIAL_VISIBLE_RELEASES + VISIBLE_BATCH_SIZE,
      );
    });
  });

  it("keeps the expanded visible window when the collection grows", async () => {
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releaseFactory.buildList(250)),
      new Error("fail"),
    );

    const { result, rerender } = renderFeatureHook(
      () => useReleasesClientHarness(document.createElement("div")),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      expect(result.current.releaseCount).toBe(250);
    });

    triggerSentinelIntersection(result.current.infiniteScrollRef);
    rerender();

    await waitFor(() => {
      expect(result.current.visibleReleases).toHaveLength(
        INITIAL_VISIBLE_RELEASES + VISIBLE_BATCH_SIZE,
      );
    });

    act(() => {
      result.current.filtersDispatch({
        type: FiltersActionTypes.SetAllReleases,
        payload: releaseFactory.buildList(300),
      });
    });

    rerender();

    await waitFor(() => {
      expect(result.current.releaseCount).toBe(300);
    });
    expect(result.current.visibleReleases).toHaveLength(
      INITIAL_VISIBLE_RELEASES + VISIBLE_BATCH_SIZE,
    );
  });

  it("resets the visible window when filters change", async () => {
    mockApiResponse(
      true,
      mockFetchDiscogsCollection,
      buildSinglePageCollection(releaseFactory.buildList(250)),
      new Error("fail"),
    );

    const { result, rerender } = renderFeatureHook(
      () => useReleasesClientHarness(document.createElement("div")),
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      expect(result.current.releaseCount).toBe(250);
    });

    triggerSentinelIntersection(result.current.infiniteScrollRef);
    rerender();

    await waitFor(() => {
      expect(result.current.visibleReleases).toHaveLength(
        INITIAL_VISIBLE_RELEASES + VISIBLE_BATCH_SIZE,
      );
    });

    act(() => {
      result.current.filtersDispatch({
        type: FiltersActionTypes.SetSort,
        payload: SortValues.AZArtist,
      });
    });

    rerender();

    await waitFor(() => {
      expect(result.current.visibleReleases).toHaveLength(
        INITIAL_VISIBLE_RELEASES,
      );
    });
  });
});
