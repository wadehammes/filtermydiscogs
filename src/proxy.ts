import { type NextRequest, NextResponse } from "next/server";
import {
  isPrivateSessionApiRoute,
  withPrivateRouteHeaders,
} from "src/lib/private-route-response";

export function proxy(request: NextRequest) {
  if (!isPrivateSessionApiRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return withPrivateRouteHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/crates/:path*"],
};
