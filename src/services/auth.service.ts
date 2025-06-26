export interface AuthStatus {
  isAuthenticated: boolean;
  username: string | null;
}

export const getUsernameFromCookies = (): string | null => {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  const usernameCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("discogs_username="),
  );
  return usernameCookie ? usernameCookie.split("=")[1] || null : null;
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
