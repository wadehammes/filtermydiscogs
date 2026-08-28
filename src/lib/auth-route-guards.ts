import type { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ROUTE_RATE_LIMIT_CONFIG,
  getIpRateLimitResponse,
} from "src/lib/ip-rate-limit";

export const enforceAuthRouteIpRateLimit = (
  request: NextRequest,
): NextResponse | null =>
  getIpRateLimitResponse(request, AUTH_ROUTE_RATE_LIMIT_CONFIG);
