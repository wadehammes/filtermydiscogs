import { beforeEach, describe, expect, it } from "@jest/globals";
import * as apiHelpers from "src/api/helpers";
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
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { cratesResponseFactory } from "src/tests/factories/CratesResponse.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { createCrateResponseFactory } from "src/tests/factories/CreateCrateResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { act, renderHook, TestProviders, waitFor } from "test-utils";
import { useMediaQuery } from "usehooks-ts";
import { useCrate } from "./crate.context";

jest.mock("src/api/helpers");
jest.mock("src/services/auth.service");

const mockApi = jest.mocked(apiHelpers);
const mockUseMediaQuery = jest.mocked(useMediaQuery);
const mockGetUserIdFromCookies = jest.mocked(getUserIdFromCookies);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);
const mockClearAuthCookies = jest.mocked(clearAuthCookies);
const mockClearUrlParams = jest.mocked(clearUrlParams);

const apiError = new Error("API request failed");

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

    mockApiResponse(
      true,
      mockApi.fetchCrates,
      cratesResponseFactory.empty(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchCrate,
      crateWithReleasesResponseFactory.empty({ user_id: 123 }),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchDiscogsCollection,
      collectionFactory.empty(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.createCrate,
      createCrateResponseFactory.named("New Crate"),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.updateCrate,
      createCrateResponseFactory.forCrate(
        crateFactory.named("Updated Crate", { id: "crate-1" }),
      ),
      apiError,
    );
    mockApiResponse(true, mockApi.deleteCrate, undefined, apiError);
    mockApiResponse(
      true,
      mockApi.addReleaseToCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.removeReleaseFromCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.syncCrates,
      crateMutationSuccessFactory.sync(0),
      apiError,
    );
  });

  it("provides initial state", async () => {
    const { result } = renderHook(() => useCrate(), {
      wrapper: TestProviders,
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
    const mockCrates = crateWithCountFactory.buildList(3);
    mockApiResponse(
      true,
      mockApi.fetchCrates,
      cratesResponseFactory.withCrates(mockCrates),
      apiError,
    );

    const { result } = renderHook(() => useCrate(), {
      wrapper: TestProviders,
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
    mockApiResponse(
      true,
      mockApi.fetchCrates,
      cratesResponseFactory.withCrates(mockCrates),
      apiError,
    );

    const { result } = renderHook(() => useCrate(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.activeCrateId).toBe("crate-2");
    });
  });

  it("selects crate", async () => {
    const { result } = renderHook(() => useCrate(), {
      wrapper: TestProviders,
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
      wrapper: TestProviders,
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
      wrapper: TestProviders,
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

    mockApiResponse(
      true,
      mockApi.fetchCrates,
      cratesResponseFactory.withCrate(
        crateWithCountFactory.build({ id: "crate-1" }),
      ),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchCrate,
      crateWithReleasesResponseFactory.withReleases(mockCrate, mockReleases),
      apiError,
    );

    const { result } = renderHook(() => useCrate(), {
      wrapper: TestProviders,
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

    mockApiResponse(
      true,
      mockApi.fetchCrates,
      cratesResponseFactory.withCrate(
        crateWithCountFactory.build({ id: "crate-1" }),
      ),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchCrate,
      crateWithReleasesResponseFactory.withReleases(mockCrate, [mockRelease]),
      apiError,
    );

    const { result } = renderHook(() => useCrate(), {
      wrapper: TestProviders,
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
    const mockCreatedCrate = crateFactory.named("New Crate");
    mockApiResponse(
      true,
      mockApi.createCrate,
      createCrateResponseFactory.forCrate(mockCreatedCrate),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.fetchCrates,
      cratesResponseFactory.withCrate(
        crateWithCountFactory.fromCrate(mockCreatedCrate),
      ),
      apiError,
    );

    const { result } = renderHook(() => useCrate(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      expect(result.current).not.toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createCrate("New Crate");
    });

    expect(mockApi.createCrate).toHaveBeenCalledWith("New Crate");

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
