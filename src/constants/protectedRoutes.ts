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

export const isPublicCrateRoute = (pathname: string): boolean =>
  pathname.startsWith("/crate/") && pathname.length > "/crate/".length;

export const isPublicPlaylistRoute = (pathname: string): boolean =>
  pathname.startsWith("/playlist/") && pathname.length > "/playlist/".length;

export const isPublicShareRoute = (pathname: string): boolean =>
  isPublicCrateRoute(pathname) || isPublicPlaylistRoute(pathname);
