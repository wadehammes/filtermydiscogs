import { beforeEach, describe, expect, it } from "@jest/globals";
import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "src/api/urls";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import {
  clearSessionAuthCookies,
  clearUrlParams,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { authUrlParamsFactory } from "src/tests/factories/AuthUrlParams.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { createMockAppRouter } from "src/tests/mocks/mockAppRouter.mock";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";
import { FILTERS_STORAGE_KEY } from "src/utils/filtersStorage";
import { RELEASE_PLAYBACK_STORAGE_KEY } from "src/utils/releasePlaybackStorage";
import { toast } from "src/utils/toast";
import { act, renderHook, waitFor } from "test-utils";
import { AuthProvider, useAuth } from "./auth.context";

jest.mock("src/api/urls");
jest.mock("src/utils/toast", () => ({
  toast: {
    dismiss: jest.fn(),
  },
}));
jest.mock("src/services/auth.service", () => {
  const actual = jest.requireActual<typeof import("src/services/auth.service")>(
    "src/services/auth.service",
  );
  const parseAuthUrlParams = jest.fn(() => ({
    authStatus: null,
    errorStatus: null,
  }));

  return {
    ...actual,
    clearAuthCookies: jest.fn(),
    clearSessionAuthCookies: jest.fn(),
    clearUrlParams: jest.fn(),
    getUsernameFromCookies: jest.fn(),
    parseAuthUrlParams,
    hasAuthSuccessUrlParam: () => parseAuthUrlParams().authStatus === "success",
  };
});

const mockUseRouter = jest.mocked(useRouter);
const mockCheckAuth = jest.mocked(api.checkAuth);
const mockLogoutApi = jest.mocked(api.logout);
const mockClearSessionAuthCookies = jest.mocked(clearSessionAuthCookies);
const mockClearUrlParams = jest.mocked(clearUrlParams);
const mockGetUsernameFromCookies = jest.mocked(getUsernameFromCookies);
const mockParseAuthUrlParams = jest.mocked(parseAuthUrlParams);
const mockToastDismiss = jest.mocked(toast.dismiss);

describe("AuthProvider", () => {
  let queryClient: QueryClient;
  let clearSpy: jest.SpiedFunction<QueryClient["clear"]>;
  let removeQueriesSpy: jest.SpiedFunction<QueryClient["removeQueries"]>;

  const mockRouter = createMockAppRouter();

  const renderAuthHook = () =>
    renderHook(() => useAuth(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider skipInitialAuthCheck={false}>{children}</AuthProvider>
        </QueryClientProvider>
      ),
    });

  beforeEach(() => {
    queryClient = createTestQueryClient();
    clearSpy = jest.spyOn(queryClient, "clear");
    removeQueriesSpy = jest.spyOn(queryClient, "removeQueries");

    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter);
    mockCheckAuth.mockResolvedValue(authStatusFactory.unauthenticated());
    mockParseAuthUrlParams.mockReturnValue(authUrlParamsFactory.empty());
    mockGetUsernameFromCookies.mockReturnValue(null);
  });

  it("provides initial state", async () => {
    const { result } = renderAuthHook();

    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.username).toBeNull();
    expect(result.current.state.isCheckingAuth).toBe(true);
    expect(result.current.state.isLoading).toBe(false);

    await waitFor(() => {
      expect(result.current.state.isCheckingAuth).toBe(false);
    });
  });

  it("keeps isCheckingAuth true when auth=success is in the URL on mount", () => {
    mockParseAuthUrlParams.mockReturnValue(authUrlParamsFactory.authSuccess());

    mockCheckAuth.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderAuthHook();

    expect(result.current.state.isCheckingAuth).toBe(true);
  });

  it("checks auth status on mount", async () => {
    mockCheckAuth.mockResolvedValueOnce(authStatusFactory.authenticated());

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isCheckingAuth).toBe(false);
    });

    expect(mockCheckAuth).toHaveBeenCalled();
    expect(result.current.state.isAuthenticated).toBe(true);
    expect(result.current.state.username).toBe("testuser");
  });

  it("clears user-scoped query cache when not authenticated", async () => {
    mockCheckAuth.mockResolvedValueOnce(authStatusFactory.unauthenticated());

    renderAuthHook();

    await waitFor(() => {
      expect(removeQueriesSpy).toHaveBeenCalled();
    });

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("does not refetch auth in a loop when unauthenticated", async () => {
    mockCheckAuth.mockResolvedValue(authStatusFactory.unauthenticated());

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isCheckingAuth).toBe(false);
    });

    const callsAfterSettle = mockCheckAuth.mock.calls.length;
    expect(callsAfterSettle).toBeGreaterThan(0);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(mockCheckAuth.mock.calls.length).toBe(callsAfterSettle);
  });

  it("treats auth check failures as unauthenticated", async () => {
    mockCheckAuth.mockRejectedValue(new Error("Auth check failed"));

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isCheckingAuth).toBe(false);
      expect(result.current.state.isAuthenticated).toBe(false);
      expect(removeQueriesSpy).toHaveBeenCalled();
    });

    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("handles successful auth from URL params", async () => {
    mockCheckAuth.mockResolvedValue(authStatusFactory.authenticated());
    mockParseAuthUrlParams.mockReturnValue(authUrlParamsFactory.authSuccess());

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    expect(result.current.state.username).toBe("testuser");
    expect(result.current.state.userId).toBe("123");
    expect(result.current.state.isCheckingAuth).toBe(false);
    expect(mockClearUrlParams).toHaveBeenCalled();
    expect(removeQueriesSpy).toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("handles auth error from URL params", async () => {
    mockCheckAuth.mockResolvedValue(authStatusFactory.unauthenticated());
    mockParseAuthUrlParams.mockReturnValue(
      authUrlParamsFactory.authError("access_denied"),
    );

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isCheckingAuth).toBe(false);
      expect(result.current.state.error).toBe(
        "Authentication failed: access_denied",
      );
    });

    expect(mockClearUrlParams).toHaveBeenCalled();
  });

  it("calls login with force when switching accounts", async () => {
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
      expect(result.current.state.isCheckingAuth).toBe(false);
    });

    act(() => {
      result.current.login({ force: true });
    });

    expect(locationHref).toBe("/api/auth/discogs?force=1");

    if (originalHrefDescriptor) {
      Object.defineProperty(window.location, "href", originalHrefDescriptor);
    }
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
      expect(result.current.state.isCheckingAuth).toBe(false);
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

  it("keeps isCheckingAuth true until the mount auth revalidation settles", async () => {
    let resolveCheck: (value: {
      isAuthenticated: boolean;
      username: string | null;
      userId: string | null;
      reconnectUsername: string | null;
      rateLimited: boolean;
    }) => void = () => {};
    const pendingCheck = new Promise<{
      isAuthenticated: boolean;
      username: string | null;
      userId: string | null;
      reconnectUsername: string | null;
      rateLimited: boolean;
    }>((resolve) => {
      resolveCheck = resolve;
    });

    queryClient.setQueryData(AuthQueryKeys.all(), {
      isAuthenticated: true,
      username: "cacheduser",
      userId: "999",
      reconnectUsername: null,
      rateLimited: false,
    });

    mockCheckAuth.mockReturnValueOnce(pendingCheck);

    const { result } = renderAuthHook();

    expect(result.current.state.isCheckingAuth).toBe(true);
    expect(result.current.state.isAuthenticated).toBe(true);
    expect(result.current.state.username).toBe("cacheduser");

    await act(async () => {
      resolveCheck(
        authStatusFactory.authenticated({
          username: "cacheduser",
          userId: "999",
        }),
      );
    });

    await waitFor(() => {
      expect(result.current.state.isCheckingAuth).toBe(false);
    });
  });

  it("calls logout function", async () => {
    mockCheckAuth.mockResolvedValue(authStatusFactory.authenticated());
    mockApiResponse(
      true,
      mockLogoutApi,
      crateMutationSuccessFactory.build(),
      new Error("Logout failed"),
    );

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogoutApi).toHaveBeenCalled();
    expect(mockToastDismiss).toHaveBeenCalledWith();
    expect(mockClearSessionAuthCookies).toHaveBeenCalled();
    expect(removeQueriesSpy).toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
    expect(result.current.state.isAuthenticated).toBe(false);
    expect(result.current.state.username).toBeNull();
    expect(result.current.state.reconnectUsername).toBe("testuser");
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("preserves filter preferences in localStorage on logout", async () => {
    const savedFilters = {
      selectedStyles: ["Rock"],
      selectedYears: [],
      selectedFormats: [],
      selectedSort: "DateAddedNew",
      styleOperator: "OR",
      searchQuery: "test",
    };

    localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(savedFilters));
    localStorage.setItem(
      RELEASE_PLAYBACK_STORAGE_KEY,
      JSON.stringify({
        instanceId: "123",
        trackPosition: "A1",
      }),
    );

    mockCheckAuth.mockResolvedValue(authStatusFactory.authenticated());
    mockApiResponse(
      true,
      mockLogoutApi,
      crateMutationSuccessFactory.build(),
      new Error("Logout failed"),
    );

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(localStorage.getItem(FILTERS_STORAGE_KEY)).toBe(
      JSON.stringify(savedFilters),
    );
    expect(localStorage.getItem(RELEASE_PLAYBACK_STORAGE_KEY)).toBeNull();
  });

  it("handles logout error", async () => {
    mockApiResponse(
      false,
      mockLogoutApi,
      crateMutationSuccessFactory.build(),
      new Error("Logout failed"),
    );

    const { result } = renderAuthHook();

    await waitFor(() => {
      expect(result.current.state.isCheckingAuth).toBe(false);
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
