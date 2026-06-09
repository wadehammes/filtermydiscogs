import { NextResponse } from "next/server";

/** Prevent CDN/proxy caching of cookie-authenticated API responses. */
export const PRIVATE_ROUTE_CACHE_HEADERS = {
  "Cache-Control":
    "private, no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Vary: "Cookie",
} as const;

export const withPrivateRouteHeaders = (
  response: NextResponse,
): NextResponse => {
  for (const [key, value] of Object.entries(PRIVATE_ROUTE_CACHE_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
};

export const privateRouteRedirect = (
  url: string | URL,
  init?: number | ResponseInit,
): NextResponse => {
  return withPrivateRouteHeaders(NextResponse.redirect(url, init));
};

export const privateRouteJson = <T>(
  body: T,
  init?: ResponseInit,
): NextResponse => {
  const headers = new Headers(init?.headers);

  for (const [key, value] of Object.entries(PRIVATE_ROUTE_CACHE_HEADERS)) {
    headers.set(key, value);
  }

  return NextResponse.json(body, { ...init, headers });
};

export const isPrivateSessionApiRoute = (pathname: string): boolean => {
  if (pathname.startsWith("/api/auth")) {
    return true;
  }

  if (!pathname.startsWith("/api/crates")) {
    return false;
  }

  return !pathname.startsWith("/api/crates/public");
};
