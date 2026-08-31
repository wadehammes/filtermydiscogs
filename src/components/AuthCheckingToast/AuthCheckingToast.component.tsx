"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAuth } from "src/context/auth.context";
import { toast } from "src/utils/toast";

const AUTH_CHECK_TOAST_ID = "auth-check";

function AuthCheckingToastInner() {
  const pathname = usePathname();
  const {
    state: { isCheckingAuth },
  } = useAuth();

  useEffect(() => {
    if (pathname !== "/") {
      toast.dismiss(AUTH_CHECK_TOAST_ID);
      return;
    }

    if (isCheckingAuth) {
      toast.loading("Checking session…", {
        id: AUTH_CHECK_TOAST_ID,
        duration: Number.POSITIVE_INFINITY,
      });
      return;
    }

    toast.dismiss(AUTH_CHECK_TOAST_ID);
  }, [isCheckingAuth, pathname]);

  return null;
}

export const AuthCheckingToast = () => (
  <Suspense fallback={null}>
    <AuthCheckingToastInner />
  </Suspense>
);
