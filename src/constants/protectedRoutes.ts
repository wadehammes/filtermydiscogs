export const PROTECTED_APP_ROUTE_PREFIXES = [
  "/releases",
  "/dashboard",
  "/mosaic",
  "/settings",
  "/crates",
  "/admin",
] as const;

export const isProtectedAppRoute = (pathname: string): boolean =>
  PROTECTED_APP_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
