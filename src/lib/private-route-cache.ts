export const PRIVATE_ROUTE_CACHE_HEADERS = {
  "Cache-Control":
    "private, no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Vary: "Cookie",
} as const;

export const isPrivateSessionApiRoute = (pathname: string): boolean => {
  if (pathname.startsWith("/api/auth")) {
    return true;
  }

  if (!pathname.startsWith("/api/crates")) {
    return false;
  }

  return !pathname.startsWith("/api/crates/public");
};

export const applyPrivateRouteCacheHeaders = (headers: Headers): void => {
  for (const [key, value] of Object.entries(PRIVATE_ROUTE_CACHE_HEADERS)) {
    headers.set(key, value);
  }
};
