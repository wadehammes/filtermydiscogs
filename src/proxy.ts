import { type NextRequest, NextResponse } from "next/server";
import {
  applyPrivateRouteCacheHeaders,
  isPrivateSessionApiRoute,
} from "src/lib/private-route-cache";

export function proxy(request: NextRequest) {
  if (!isPrivateSessionApiRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  applyPrivateRouteCacheHeaders(response.headers);
  return response;
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/crates/:path*"],
};
