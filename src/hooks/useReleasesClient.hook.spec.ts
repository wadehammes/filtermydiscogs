import { beforeEach, describe, expect, it } from "@jest/globals";
import { fetchDiscogsCollection, updateUserPreferences } from "src/api/helpers";
import { VIEW_STATE_STORAGE_KEY } from "src/constants/storageKeys";
import { useReleasesClient } from "src/hooks/useReleasesClient.hook";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { userPreferencesFactory } from "src/tests/factories/UserPreferences.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { act, renderFeatureHook, waitFor } from "test-utils";

jest.mock("src/api/helpers", () => ({
  fetchDiscogsCollection: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

const mockFetchDiscogsCollection = jest.mocked(fetchDiscogsCollection);
const mockUpdateUserPreferences = jest.mocked(updateUserPreferences);

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

describe("useReleasesClient", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    setupMockMatchMedia({ desktop: true });
    mockUpdateUserPreferences.mockResolvedValue({
      preferences: userPreferencesFactory.defaults(),
    });
  });

  it("loads releases and tracks selected release modal state", async () => {
    const releases = releaseFactory.buildList(2);
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
      expect(result.current.releaseCount).toBe(2);
    });

    act(() => {
      result.current.handleReleaseClick(String(releases[0]?.instance_id));
    });

    expect(result.current.selectedReleaseId).toBe(
      String(releases[0]?.instance_id),
    );
    expect(result.current.selectedRelease?.instance_id).toBe(
      releases[0]?.instance_id,
    );

    act(() => {
      result.current.handleCloseModal();
    });

    expect(result.current.selectedReleaseId).toBeNull();
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
