import { beforeEach, describe, expect, it } from "@jest/globals";
import type { QueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { logout as logoutApi } from "src/api/helpers";
import { DiscogsCollectionQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  checkAuthStatus,
  clearAuthCookies,
  clearUrlParams,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import { act, renderHook, TestProviders, waitFor } from "test-utils";
import { AuthActionTypes, useAuth } from "./auth.context";

jest.mock("src/api/helpers");
jest.mock("src/services/auth.service");

const mockUseRouter = jest.mocked(useRouter);
const mockLogoutApi = jest.mocked(logoutApi);
const mockClearAuthCookies = jest.mocked(clearAuthCookies);
const mockClearUrlParams = jest.mocked(clearUrlParams);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);
const mockCheckAuthStatus = jest.mocked(checkAuthStatus);

describe("AuthProvider", () => {
  let queryClient: QueryClient;
  let clearSpy: jest.SpiedFunction<QueryClient["clear"]>;
  let invalidateQueriesSpy: jest.SpiedFunction<
    QueryClient["invalidateQueries"]
  >;

  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  } as ReturnType<typeof useRouter>;

  const renderAuthHook = () =>
    renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <TestProviders queryClient={queryClient}>{children}</TestProviders>
      ),
    });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    clearSpy = jest.spyOn(queryClient, "clear");
    invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockCheckAuthStatus.mockResolvedValue({
      isAuthenticated: false,
      username: null,
      userId: null,
    });
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: null,
      errorStatus: null,
    });
    mockGetUsernameFromCookies.mockReturnValue(null);
  });

  it("provides initial state", async () => {
    const { result } = renderAuthHook();

    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.username).toBeNull();
    expect(result.current.state.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });
  });

  it("checks auth status on mount", async () => {
    mockCheckAuthStatus.mockResolvedValueOnce({
      isAuthenticated: true,
      username: "testuser",
      userId: "123",
    });

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    expect(mockCheckAuthStatus).toHaveBeenCalled();
    expect(result.current.state.isAuthenticated).toBe(true);
    expect(result.current.state.username).toBe("testuser");
  });

  it("clears query cache when not authenticated", async () => {
    mockCheckAuthStatus.mockResolvedValueOnce({
      isAuthenticated: false,
      username: null,
      userId: null,
    });

    renderAuthHook();

    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  it("handles auth check error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockCheckAuthStatus.mockRejectedValueOnce(new Error("Auth check failed"));

    renderAuthHook();

    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("handles successful auth from URL params", async () => {
    mockCheckAuthStatus.mockResolvedValue({
      isAuthenticated: false,
      username: null,
      userId: null,
    });
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: "success",
      errorStatus: null,
    });
    mockGetUsernameFromCookies.mockReturnValue("testuser");

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    expect(result.current.state.username).toBe("testuser");
    expect(result.current.state.isLoading).toBe(false);
    expect(mockClearUrlParams).toHaveBeenCalled();
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: DiscogsCollectionQueryKeys.all(),
    });
  });

  it("handles auth error from URL params", async () => {
    mockCheckAuthStatus.mockResolvedValue({
      isAuthenticated: false,
      username: null,
      userId: null,
    });
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: null,
      errorStatus: "access_denied",
    });

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBe(
        "Authentication failed: access_denied",
      );
    });

    expect(mockClearUrlParams).toHaveBeenCalled();
  });

  it("calls login function", async () => {
    let locationHref = "http://localhost/";
    const originalHrefDescriptor = Object.getOwnPropertyDescriptor(
      window.location,
      "href",
    );

    try {
      Object.defineProperty(window.location, "href", {
        configurable: true,
        get() {
          return locationHref;
        },
        set(value: string) {
          locationHref = value;
        },
      });
    } catch {
      return;
    }

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    act(() => {
      result.current.login();
    });

    expect(result.current.state.isLoading).toBe(true);
    expect(result.current.state.error).toBeNull();
    expect(locationHref).toBe("/api/auth/discogs");

    if (originalHrefDescriptor) {
      Object.defineProperty(window.location, "href", originalHrefDescriptor);
    }
  });

  it("calls logout function", async () => {
    mockApiResponse(
      true,
      mockLogoutApi,
      { success: true },
      new Error("Logout failed"),
    );

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    act(() => {
      result.current.dispatch({
        type: AuthActionTypes.SetAuthenticated,
        payload: true,
      });
      result.current.dispatch({
        type: AuthActionTypes.SetUsername,
        payload: "testuser",
      });
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogoutApi).toHaveBeenCalled();
    expect(mockClearAuthCookies).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.username).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("handles logout error", async () => {
    mockApiResponse(
      false,
      mockLogoutApi,
      { success: true },
      new Error("Logout failed"),
    );

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.state.error).toBe("Logout failed");
    expect(result.current.state.isLoggingOut).toBe(false);
  });

  it("throws error when useAuth is used outside AuthProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });
});
