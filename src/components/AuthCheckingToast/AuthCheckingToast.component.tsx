"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "src/context/auth.context";

const AUTH_CHECK_TOAST_ID = "auth-check";

export const AuthCheckingToast = () => {
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
};
