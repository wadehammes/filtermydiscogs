import type { AuthState } from "src/context/auth.context";

export const testUnauthenticatedAuthState: AuthState = {
  isAuthenticated: false,
  username: null,
  userId: null,
  reconnectUsername: null,
  isCheckingAuth: false,
  isLoading: false,
  isLoggingOut: false,
  rateLimited: false,
  error: null,
};

export const testAuthenticatedAuthState: AuthState = {
  isAuthenticated: true,
  username: "testuser",
  userId: "123",
  reconnectUsername: null,
  isCheckingAuth: false,
  isLoading: false,
  isLoggingOut: false,
  rateLimited: false,
  error: null,
};
