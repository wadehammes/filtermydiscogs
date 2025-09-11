import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthActionTypes, useAuth } from "src/context/auth.context";
import {
  clearUrlParams,
  getUsernameFromCookies,
  parseAuthUrlParams,
} from "src/services/auth.service";

export const useAuthRedirect = () => {
  const router = useRouter();
  const { state: authState, dispatch: authDispatch } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = authState;

  useEffect(() => {
    if (!(authLoading || isAuthenticated)) {
      router.replace("/");
    }
  }, [isAuthenticated, authLoading, router]);
  useEffect(() => {
    const { authStatus, errorStatus } = parseAuthUrlParams();

    if (authStatus === "success") {
      const username = getUsernameFromCookies();

      authDispatch({ type: AuthActionTypes.SetAuthenticated, payload: true });
      authDispatch({ type: AuthActionTypes.SetUsername, payload: username });
      authDispatch({ type: AuthActionTypes.SetLoading, payload: false });

      clearUrlParams();
    } else if (errorStatus) {
      authDispatch({
        type: AuthActionTypes.SetError,
        payload: `Authentication failed: ${errorStatus}`,
      });
      authDispatch({ type: AuthActionTypes.SetLoading, payload: false });

      clearUrlParams();
    }
  }, [authDispatch]);

  return { authLoading };
};
