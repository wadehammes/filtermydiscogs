"use client";

import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { useContext } from "react";
import {
  isProtectedAppRoute,
  isPublicShareRoute,
} from "src/constants/protectedRoutes";

export const useRouterPathname = (): string => {
  const pathname = useContext(PathnameContext);

  return pathname ?? "/";
};

export const useAuthenticatedGatePathname = (): string => {
  const pathname = useRouterPathname();

  if (typeof window === "undefined" || !isProtectedAppRoute(pathname)) {
    return pathname;
  }

  const livePathname = window.location.pathname;

  if (livePathname === pathname) {
    return pathname;
  }

  if (isPublicShareRoute(livePathname)) {
    return livePathname;
  }

  return pathname;
};
