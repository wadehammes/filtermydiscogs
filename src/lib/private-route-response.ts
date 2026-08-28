import { NextResponse } from "next/server";
import { applyPrivateRouteCacheHeaders } from "src/lib/private-route-cache";

export {
  isPrivateSessionApiRoute,
  PRIVATE_ROUTE_CACHE_HEADERS,
} from "src/lib/private-route-cache";

export const withPrivateRouteHeaders = (
  response: NextResponse,
): NextResponse => {
  applyPrivateRouteCacheHeaders(response.headers);
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
  applyPrivateRouteCacheHeaders(headers);

  return NextResponse.json(body, { ...init, headers });
};
