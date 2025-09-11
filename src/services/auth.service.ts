import Cookies from "js-cookie";

export interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
}

export const getUsernameFromCookies = (): string | null => {
  if (typeof document === "undefined") return null;
  return Cookies.get("discogs_username") || null;
};

export const clearAuthCookies = (): void => {
  if (typeof document === "undefined") return;

  // Clear all auth-related cookies
  Cookies.remove("discogs_username");
  Cookies.remove("discogs_access_token");
  Cookies.remove("discogs_access_token_secret");
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
    const response = await fetch("/api/auth/check", {
      method: "GET",
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();
      return {
        isAuthenticated: data.isAuthenticated,
        username: data.username || null,
      };
    }
  } catch (_error) {
    // Silent fail
  }

  return {
    isAuthenticated: false,
    username: null,
  };
};
