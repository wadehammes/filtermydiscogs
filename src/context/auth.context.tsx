import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { checkAuthStatus, clearAuthCookies } from "src/services/auth.service";

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  isLoggingOut: boolean;
  error: string | null;
}

export enum AuthActionTypes {
  SetAuthenticated = "SetAuthenticated",
  SetUsername = "SetUsername",
  SetLoading = "SetLoading",
  SetLoggingOut = "SetLoggingOut",
  SetError = "SetError",
  Logout = "Logout",
}

export type AuthActions =
  | { type: AuthActionTypes.SetAuthenticated; payload: boolean }
  | { type: AuthActionTypes.SetUsername; payload: string | null }
  | { type: AuthActionTypes.SetLoading; payload: boolean }
  | { type: AuthActionTypes.SetLoggingOut; payload: boolean }
  | { type: AuthActionTypes.SetError; payload: string | null }
  | { type: AuthActionTypes.Logout; payload: undefined };

const authReducer = (state: AuthState, action: AuthActions): AuthState => {
  switch (action.type) {
    case AuthActionTypes.SetAuthenticated:
      return {
        ...state,
        isAuthenticated: action.payload,
      };
    case AuthActionTypes.SetUsername:
      return {
        ...state,
        username: action.payload,
      };
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
        ...state,
        isAuthenticated: false,
        username: null,
        error: null,
        isLoading: false,
        isLoggingOut: false,
      };
    default:
      return state;
  }
};

const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  isLoading: true,
  isLoggingOut: false,
  error: null,
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthActions>;
  login: () => void;
  logout: () => Promise<void>;
} | null>(null);

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await checkAuthStatus();
        if (authStatus.isAuthenticated && authStatus.username) {
          dispatch({ type: AuthActionTypes.SetAuthenticated, payload: true });
          dispatch({
            type: AuthActionTypes.SetUsername,
            payload: authStatus.username,
          });
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        dispatch({ type: AuthActionTypes.SetLoading, payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = () => {
    dispatch({ type: AuthActionTypes.SetLoading, payload: true });
    dispatch({ type: AuthActionTypes.SetError, payload: null });

    // Redirect to OAuth initiation
    window.location.href = "/api/auth/discogs";
  };

  const logout = async () => {
    try {
      dispatch({ type: AuthActionTypes.SetLoggingOut, payload: true });

      // Call logout API
      await fetch("/api/auth/logout", { method: "POST" });

      // Clear client-side cookies as well
      clearAuthCookies();

      dispatch({ type: AuthActionTypes.Logout, payload: undefined });
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
