import Cookies from "js-cookie";
import { checkAuth as checkAuthApi } from "src/api/helpers";

export interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
}

export const getUsernameFromCookies = (): string | null => {
  if (typeof document === "undefined") return null;
  return Cookies.get("discogs_username") || null;
};

export const getUserIdFromCookies = (): string | null => {
  if (typeof document === "undefined") return null;
  return Cookies.get("discogs_user_id") || null;
};

export const clearAuthCookies = (): void => {
  if (typeof document === "undefined") return;

  // Clear session state (username, user_id) and temporary OAuth tokens
  // Note: discogs_access_token and discogs_access_token_secret are httpOnly cookies
  // and cannot be cleared from client-side JavaScript. They are preserved on logout
  // so users can log back in without re-authorization.
  Cookies.remove("discogs_username");
  Cookies.remove("discogs_user_id");
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
    const data = await checkAuthApi();
    return {
      isAuthenticated: data.isAuthenticated,
      username: data.username || null,
      userId: data.userId || null,
    };
  } catch (_error) {
    // Silent fail
    return {
      isAuthenticated: false,
      username: null,
      userId: null,
    };
  }
};
