import Cookies from "js-cookie";
import { api } from "src/api/urls";

export interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  reconnectUsername: string | null;
  rateLimited: boolean;
  showSupportProjectToast: boolean;
}

export const normalizeAuthStatus = (data: {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  reconnectUsername?: string | null;
  rateLimited?: boolean;
  showSupportProjectToast?: boolean;
}): AuthStatus => ({
  isAuthenticated: data.isAuthenticated,
  username: data.username || null,
  userId: data.userId || null,
  reconnectUsername: data.reconnectUsername || null,
  rateLimited: data.rateLimited === true,
  showSupportProjectToast: data.showSupportProjectToast === true,
});

export const getUsernameFromCookies = (): string | null => {
  if (typeof document === "undefined") return null;
  return Cookies.get("discogs_username") || null;
};

export const clearSessionAuthCookies = (): void => {
  if (typeof document === "undefined") return;

  Cookies.remove("discogs_username");
  Cookies.remove("oauth_token");
  Cookies.remove("oauth_token_secret");
};

export const clearAuthCookies = (): void => {
  if (typeof document === "undefined") return;

  clearSessionAuthCookies();
  Cookies.remove("discogs_reconnect_username");
};

export const clearUrlParams = (): void => {
  if (typeof window === "undefined") return;

  window.history.replaceState({}, document.title, window.location.pathname);
};

export const parseAuthUrlParams = (): {
  authStatus: string | null;
  errorStatus: string | null;
} => {
  if (typeof window === "undefined") {
    return { authStatus: null, errorStatus: null };
  }

  const urlParams = new URLSearchParams(window.location.search);
  return {
    authStatus: urlParams.get("auth"),
    errorStatus: urlParams.get("error"),
  };
};

export const hasAuthSuccessUrlParam = (): boolean =>
  parseAuthUrlParams().authStatus === "success";

export const checkAuthStatus = async (): Promise<AuthStatus> => {
  try {
    return normalizeAuthStatus(await api.checkAuth());
  } catch (_error) {
    return {
      isAuthenticated: false,
      username: null,
      userId: null,
      reconnectUsername: null,
      rateLimited: false,
      showSupportProjectToast: false,
    };
  }
};
