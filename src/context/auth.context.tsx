"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  trackLoginCompleted,
  trackLoginStarted,
} from "src/analytics/productAnalyticsEvents";
import { logout as logoutApi } from "src/api/helpers";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import { useAuthQuery } from "src/hooks/queries/useAuthQuery";
import { clearUserScopedQueries } from "src/lib/user-scoped-queries";
import {
  clearSessionAuthCookies,
  clearUrlParams,
  hasAuthSuccessUrlParam,
  parseAuthUrlParams,
} from "src/services/auth.service";
import { clearPersistedReleasePlayback } from "src/utils/releasePlaybackStorage";

export type LoginOptions = {
  force?: boolean;
};

export type LogoutOptions = {
  preserveTokens?: boolean;
};

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  reconnectUsername: string | null;
  isCheckingAuth: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  rateLimited: boolean;
  error: string | null;
}

interface AuthUiState {
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string | null;
}

export enum AuthActionTypes {
  SetLoading = "SetLoading",
  SetLoggingOut = "SetLoggingOut",
  SetError = "SetError",
  Logout = "Logout",
}

export type AuthActions =
  | { type: AuthActionTypes.SetLoading; payload: boolean }
  | { type: AuthActionTypes.SetLoggingOut; payload: boolean }
  | { type: AuthActionTypes.SetError; payload: string | null }
  | { type: AuthActionTypes.Logout; payload: undefined };

const authUiReducer = (
  state: AuthUiState,
  action: AuthActions,
): AuthUiState => {
  switch (action.type) {
    case AuthActionTypes.SetLoading:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AuthActionTypes.SetLoggingOut:
      return {
        ...state,
        isLoggingOut: action.payload,
      };
    case AuthActionTypes.SetError:
      return {
        ...state,
        error: action.payload,
      };
    case AuthActionTypes.Logout:
      return {
        isLoading: false,
        isLoggingOut: false,
        error: null,
      };
    default:
      return state;
  }
};

const initialUiState: AuthUiState = {
  isLoading: false,
  isLoggingOut: false,
  error: null,
};

const unauthenticatedSession: Pick<
  AuthState,
  | "isAuthenticated"
  | "username"
  | "userId"
  | "reconnectUsername"
  | "rateLimited"
  | "isCheckingAuth"
> = {
  isAuthenticated: false,
  username: null,
  userId: null,
  reconnectUsername: null,
  rateLimited: false,
  isCheckingAuth: false,
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthActions>;
  login: (options?: LoginOptions) => void;
  logout: (options?: LogoutOptions) => Promise<void>;
} | null>(null);

interface AuthProviderProps extends PropsWithChildren {
  initialState?: AuthState;
  skipInitialAuthCheck?: boolean;
}

export const AuthProvider = ({
  children,
  initialState: initialStateOverride,
  skipInitialAuthCheck = false,
}: AuthProviderProps) => {
  const [uiState, dispatch] = useReducer(authUiReducer, initialUiState);
  const queryClient = useQueryClient();
  const router = useRouter();
  const prevRateLimitedRef = useRef(false);
  const hasHandledAuthUrlRef = useRef(false);
  const [isCompletingOAuth, setIsCompletingOAuth] = useState(
    hasAuthSuccessUrlParam,
  );
  const [hasCompletedAuthCheck, setHasCompletedAuthCheck] =
    useState(skipInitialAuthCheck);

  const {
    data: authData,
    isPending,
    isFetching,
    refetch,
  } = useAuthQuery({
    enabled: !skipInitialAuthCheck,
  });

  useEffect(() => {
    if (skipInitialAuthCheck || isPending || isFetching) {
      return;
    }

    setHasCompletedAuthCheck(true);
  }, [isFetching, isPending, skipInitialAuthCheck]);

  const sessionState = useMemo(() => {
    if (skipInitialAuthCheck && initialStateOverride) {
      return {
        isAuthenticated: initialStateOverride.isAuthenticated,
        username: initialStateOverride.username,
        userId: initialStateOverride.userId,
        reconnectUsername: initialStateOverride.reconnectUsername,
        rateLimited: initialStateOverride.rateLimited,
        isCheckingAuth: initialStateOverride.isCheckingAuth,
      };
    }

    if (skipInitialAuthCheck) {
      return unauthenticatedSession;
    }

    return {
      isAuthenticated: Boolean(authData?.isAuthenticated && authData.username),
      username: authData?.username ?? null,
      userId: authData?.userId ?? null,
      reconnectUsername: authData?.isAuthenticated
        ? null
        : (authData?.reconnectUsername ?? null),
      rateLimited: authData?.rateLimited ?? false,
      isCheckingAuth:
        isCompletingOAuth || !hasCompletedAuthCheck || (isPending && !authData),
    };
  }, [
    authData,
    hasCompletedAuthCheck,
    initialStateOverride,
    isCompletingOAuth,
    isPending,
    skipInitialAuthCheck,
  ]);

  const state: AuthState = useMemo(
    () => ({
      ...sessionState,
      isLoading: uiState.isLoading,
      isLoggingOut: uiState.isLoggingOut,
      error: uiState.error,
    }),
    [sessionState, uiState],
  );

  useEffect(() => {
    if (skipInitialAuthCheck || isPending) {
      return;
    }

    if (!sessionState.isAuthenticated) {
      clearUserScopedQueries(queryClient);
    }
  }, [
    isPending,
    queryClient,
    sessionState.isAuthenticated,
    skipInitialAuthCheck,
  ]);

  useEffect(() => {
    if (skipInitialAuthCheck || hasHandledAuthUrlRef.current) {
      return;
    }

    const { authStatus, errorStatus } = parseAuthUrlParams();
    hasHandledAuthUrlRef.current = true;

    if (authStatus === "success") {
      setIsCompletingOAuth(true);
      void refetch()
        .then((result) => {
          const data = result.data;
          if (data?.isAuthenticated && data.username) {
            if (data.userId) {
              trackLoginCompleted(data.userId);
            }
            clearUserScopedQueries(queryClient);
          }
          clearUrlParams();
        })
        .finally(() => {
          setIsCompletingOAuth(false);
        });
      return;
    }

    if (errorStatus) {
      dispatch({
        type: AuthActionTypes.SetError,
        payload: `Authentication failed: ${errorStatus}`,
      });
      clearUrlParams();
    }
  }, [queryClient, refetch, skipInitialAuthCheck]);

  useEffect(() => {
    if (skipInitialAuthCheck) {
      return;
    }

    const wasRateLimited = prevRateLimitedRef.current;
    const isRateLimited = sessionState.rateLimited;

    if (wasRateLimited && !isRateLimited && sessionState.isAuthenticated) {
      clearUserScopedQueries(queryClient);
    }

    prevRateLimitedRef.current = isRateLimited;
  }, [
    queryClient,
    sessionState.isAuthenticated,
    sessionState.rateLimited,
    skipInitialAuthCheck,
  ]);

  const login = (options?: LoginOptions) => {
    dispatch({ type: AuthActionTypes.SetLoading, payload: true });
    dispatch({ type: AuthActionTypes.SetError, payload: null });
    trackLoginStarted();
    window.location.href = options?.force
      ? "/api/auth/discogs?force=1"
      : "/api/auth/discogs";
  };

  const logout = async (options?: LogoutOptions) => {
    const preserveTokens = options?.preserveTokens ?? true;
    const reconnectUsername = preserveTokens ? sessionState.username : null;

    try {
      dispatch({ type: AuthActionTypes.SetLoggingOut, payload: true });

      await logoutApi({
        preserveTokens,
      });
      clearSessionAuthCookies();
      clearPersistedReleasePlayback();
      dispatch({ type: AuthActionTypes.Logout, payload: undefined });
      queryClient.setQueryData(AuthQueryKeys.all(), {
        isAuthenticated: false,
        username: null,
        userId: null,
        rateLimited: false,
        reconnectUsername,
      });
      void refetch();
      router.replace("/");
      clearUserScopedQueries(queryClient);
    } catch (_error) {
      dispatch({ type: AuthActionTypes.SetError, payload: "Logout failed" });
      dispatch({ type: AuthActionTypes.SetLoggingOut, payload: false });
    }
  };

  return (
    <AuthContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
