import type { AuthState } from "src/context/auth.context";

export const testUnauthenticatedAuthState: AuthState = {
  isAuthenticated: false,
  username: null,
  isLoading: false,
  isLoggingOut: false,
  error: null,
};

export const testAuthenticatedAuthState: AuthState = {
  isAuthenticated: true,
  username: "testuser",
  isLoading: false,
  isLoggingOut: false,
  error: null,
};
