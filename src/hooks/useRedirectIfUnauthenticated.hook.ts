import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "src/context/auth.context";

export const useRedirectIfUnauthenticated = () => {
  const router = useRouter();
  const { state: authState } = useAuth();

  const shouldRedirectHome = !(
    authState.isAuthenticated || authState.isCheckingAuth
  );
  const isCheckingAuth = !authState.isAuthenticated && authState.isCheckingAuth;

  useEffect(() => {
    if (shouldRedirectHome) {
      router.replace("/");
    }
  }, [shouldRedirectHome, router]);

  return { shouldRedirectHome, isCheckingAuth };
};
