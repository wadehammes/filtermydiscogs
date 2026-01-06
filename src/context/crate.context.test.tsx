import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { mocked } from "jest-mock";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  addReleaseToCrate,
  createCrate,
  deleteCrate,
  fetchCrate,
  fetchCrates,
  fetchDiscogsCollection,
  removeReleaseFromCrate,
  syncCrates,
  updateCrate,
} from "src/api/helpers";
import { AuthProvider } from "src/context/auth.context";
import { CollectionContextProvider } from "src/context/collection.context";
import { FiltersProvider } from "src/context/filters.context";
import { ThemeProvider } from "src/context/theme.context";
import { ViewProvider } from "src/context/view.context";
import {
  checkAuthStatus,
  clearAuthCookies,
  clearUrlParams,
  getUserIdFromCookies,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import { useMediaQuery } from "usehooks-ts";
import { CrateProvider, useCrate } from "./crate.context";

jest.mock("src/api/helpers");
jest.mock("src/services/auth.service");

const mockUseMediaQuery = mocked(useMediaQuery);

const mockFetchCrates = mocked(fetchCrates);
const mockFetchCrate = mocked(fetchCrate);
const mockFetchDiscogsCollection = mocked(fetchDiscogsCollection);
const mockCreateCrate = mocked(createCrate);
const mockUpdateCrate = mocked(updateCrate);
const mockDeleteCrate = mocked(deleteCrate);
const mockAddReleaseToCrate = mocked(addReleaseToCrate);
const mockRemoveReleaseFromCrate = mocked(removeReleaseFromCrate);
const mockSyncCrates = mocked(syncCrates);
const mockGetUserIdFromCookies = mocked(getUserIdFromCookies);
const mockGetUsernameFromCookies = mocked(getUsernameFromCookies);
const mockCheckAuthStatus = mocked(checkAuthStatus);
const mockParseAuthUrlParams = mocked(parseAuthUrlParams);
const mockClearAuthCookies = mocked(clearAuthCookies);
const mockClearUrlParams = mocked(clearUrlParams);

const CrateTestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = useMemo(() => createTestQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CollectionContextProvider>
            <FiltersProvider>
              <CrateProvider>
                <ViewProvider>{children}</ViewProvider>
              </CrateProvider>
            </FiltersProvider>
          </CollectionContextProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe("CrateProvider", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    mockUseMediaQuery.mockReturnValue(false);

    mockGetUserIdFromCookies.mockReturnValue("123");
    mockGetUsernameFromCookies.mockReturnValue("testuser");
    mockCheckAuthStatus.mockResolvedValue({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
    });
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: null,
      errorStatus: null,
    });
    mockClearAuthCookies.mockImplementation(() => {});
    mockClearUrlParams.mockImplementation(() => {});

    mockFetchCrates.mockResolvedValue({ crates: [] });
    mockFetchCrate.mockResolvedValue({
      crate: crateFactory.build({ user_id: 123 }),
      releases: [],
    });
    mockFetchDiscogsCollection.mockResolvedValue(
      collectionFactory.build({ releases: [] }),
    );
    mockCreateCrate.mockResolvedValue({
      crate: crateFactory.build({
        user_id: 123,
        id: "new-crate",
        name: "New Crate",
      }),
    });
    mockUpdateCrate.mockResolvedValue({
      crate: crateFactory.build({
        user_id: 123,
        id: "crate-1",
        name: "Updated Crate",
      }),
    });
    mockDeleteCrate.mockResolvedValue(undefined);
    mockAddReleaseToCrate.mockResolvedValue({ success: true });
    mockRemoveReleaseFromCrate.mockResolvedValue({ success: true });
    mockSyncCrates.mockResolvedValue({ success: true, removedCount: 0 });
  });

  it("provides initial state", async () => {
    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.crates).toEqual([]);
    expect(result.current.activeCrateId).toBeNull();
    expect(result.current.selectedReleases).toEqual([]);
    expect(result.current.isDrawerOpen).toBe(false);
  });

  it("provides crates from fetchCrates", async () => {
    const mockCrates = crateFactory.buildList(3);
    mockFetchCrates.mockResolvedValue({ crates: mockCrates });

    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.crates).toEqual(mockCrates);
    });
  });

  it("sets active crate to default crate when crates are loaded", async () => {
    const mockCrates = [
      crateFactory.build({ id: "crate-1", is_default: false }),
      crateFactory.build({ id: "crate-2", is_default: true }),
    ];
    mockFetchCrates.mockResolvedValue({ crates: mockCrates });

    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeCrateId).toBe("crate-2");
    });
  });

  it("selects crate", async () => {
    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectCrate("crate-1");
    });

    await waitFor(() => {
      expect(result.current.activeCrateId).toBe("crate-1");
    });
  });

  it("toggles drawer", async () => {
    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isDrawerOpen).toBe(false);

    act(() => {
      result.current.toggleDrawer();
    });

    await waitFor(() => {
      expect(result.current.isDrawerOpen).toBe(true);
    });

    act(() => {
      result.current.toggleDrawer();
    });

    await waitFor(() => {
      expect(result.current.isDrawerOpen).toBe(false);
    });
  });

  it("opens and closes drawer", async () => {
    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.openDrawer();
    });

    await waitFor(() => {
      expect(result.current.isDrawerOpen).toBe(true);
    });

    act(() => {
      result.current.closeDrawer();
    });

    await waitFor(() => {
      expect(result.current.isDrawerOpen).toBe(false);
    });
  });

  it("provides selected releases from active crate", async () => {
    const mockReleases = releaseFactory.buildList(2);
    const mockCrate = crateFactory.build({ id: "crate-1" });

    mockFetchCrates.mockResolvedValue({ crates: [mockCrate] });
    mockFetchCrate.mockResolvedValue({
      crate: mockCrate,
      releases: mockReleases,
    });

    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectCrate("crate-1");
    });

    await waitFor(() => {
      expect(result.current.selectedReleases).toEqual(mockReleases);
    });
  });

  it("checks if release is in crate", async () => {
    const mockRelease = releaseFactory.build({ instance_id: "release-1" });
    const mockCrate = crateFactory.build({ id: "crate-1" });

    mockFetchCrates.mockResolvedValue({ crates: [mockCrate] });
    mockFetchCrate.mockResolvedValue({
      crate: mockCrate,
      releases: [mockRelease],
    });

    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectCrate("crate-1");
    });

    await waitFor(() => {
      expect(result.current.isInCrate("release-1")).toBe(true);
      expect(result.current.isInCrate("release-2")).toBe(false);
    });
  });

  it("creates crate and sets it as active", async () => {
    const mockCreatedCrate = crateFactory.build({
      user_id: 123,
      id: "new-crate",
      name: "New Crate",
    });
    mockCreateCrate.mockResolvedValue({
      crate: mockCreatedCrate,
    });
    mockFetchCrates.mockResolvedValue({ crates: [mockCreatedCrate] });

    const { result } = renderHook(() => useCrate(), {
      wrapper: CrateTestWrapper,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createCrate("New Crate");
    });

    expect(mockCreateCrate).toHaveBeenCalledWith("New Crate");

    await waitFor(() => {
      expect(result.current.activeCrateId).toBe("new-crate");
    });
  });

  it("throws error when useCrate is used outside CrateProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useCrate());
    }).toThrow("useCrate must be used within a CrateProvider");

    consoleSpy.mockRestore();
  });
});
