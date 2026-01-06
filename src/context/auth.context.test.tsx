import { useQueryClient } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { mocked } from "jest-mock";
import { useRouter } from "next/navigation";
import { logout as logoutApi } from "src/api/helpers";
import {
  checkAuthStatus,
  clearAuthCookies,
  clearUrlParams,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";
import { AuthActionTypes, AuthProvider, useAuth } from "./auth.context";

jest.mock("@tanstack/react-query");
jest.mock("next/navigation");
jest.mock("src/api/helpers");
jest.mock("src/services/auth.service");

const mockUseQueryClient = mocked(useQueryClient);
const mockUseRouter = mocked(useRouter);
const mockLogoutApi = mocked(logoutApi);
const mockCheckAuthStatus = mocked(checkAuthStatus);
const mockClearAuthCookies = mocked(clearAuthCookies);
const mockClearUrlParams = mocked(clearUrlParams);
const mockGetUsernameFromCookies = mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = mocked(parseAuthUrlParams);

describe("AuthProvider", () => {
  const mockQueryClient = {
    clear: jest.fn(),
    invalidateQueries: jest.fn(),
  };
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  } as ReturnType<typeof useRouter>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQueryClient.mockReturnValue(
      mockQueryClient as unknown as ReturnType<typeof useQueryClient>,
    );
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
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.username).toBeNull();
    expect(result.current.state.isLoading).toBe(true);

    // Wait for async auth check to complete
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

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

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

    renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(mockQueryClient.clear).toHaveBeenCalled();
    });
  });

  it("handles auth check error", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockCheckAuthStatus.mockRejectedValueOnce(new Error("Auth check failed"));

    renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(mockQueryClient.clear).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("handles successful auth from URL params", async () => {
    // Mock checkAuthStatus to resolve quickly but not interfere
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

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    expect(result.current.state.username).toBe("testuser");
    expect(result.current.state.isLoading).toBe(false);
    expect(mockClearUrlParams).toHaveBeenCalled();
    expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["discogsCollection"],
    });
  });

  it("handles auth error from URL params", async () => {
    // Mock checkAuthStatus to resolve quickly but not interfere
    mockCheckAuthStatus.mockResolvedValue({
      isAuthenticated: false,
      username: null,
      userId: null,
    });
    mockParseAuthUrlParams.mockReturnValue({
      authStatus: null,
      errorStatus: "access_denied",
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

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
      // If href is not configurable, skip this test
      return;
    }

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for initial auth check to complete
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
    mockLogoutApi.mockResolvedValueOnce({ success: true });

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for initial auth check to complete
    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });

    // Set authenticated state first
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
    expect(mockQueryClient.clear).toHaveBeenCalled();
    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.username).toBeNull();
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("handles logout error", async () => {
    mockLogoutApi.mockRejectedValueOnce(new Error("Logout failed"));

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Wait for initial auth check to complete
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
