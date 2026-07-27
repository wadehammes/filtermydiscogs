import Cookies from "js-cookie";
import { checkAuth as checkAuthApi } from "src/api/helpers";

export interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  rateLimited: boolean;
}

export const normalizeAuthStatus = (data: {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  rateLimited?: boolean;
}): AuthStatus => ({
  isAuthenticated: data.isAuthenticated,
  username: data.username || null,
  userId: data.userId || null,
  rateLimited: data.rateLimited === true,
});

export const getUsernameFromCookies = (): string | null => {
  if (typeof document === "undefined") return null;
  return Cookies.get("discogs_username") || null;
};

export const clearAuthCookies = (): void => {
  if (typeof document === "undefined") return;

  // Clear display/session cookies readable by client JS.
  // httpOnly cookies (discogs_user_id, OAuth tokens) are cleared by API routes.
  Cookies.remove("discogs_username");
  Cookies.remove("oauth_token");
  Cookies.remove("oauth_token_secret");
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

export const checkAuthStatus = async (): Promise<AuthStatus> => {
  try {
    return normalizeAuthStatus(await checkAuthApi());
  } catch (_error) {
    // Silent fail
    return {
      isAuthenticated: false,
      username: null,
      userId: null,
      rateLimited: false,
    };
  }
};
