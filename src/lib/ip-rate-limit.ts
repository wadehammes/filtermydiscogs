import { type NextRequest, NextResponse } from "next/server";

interface IpRateLimitEntry {
  count: number;
  resetAt: Date;
}

const ipRateLimitStore = new Map<string, IpRateLimitEntry>();

export type IpRateLimitConfig = {
  maxRequests: number;
  windowMs: number;
};

const DEFAULT_IP_RATE_LIMIT_CONFIG: IpRateLimitConfig = {
  maxRequests: parseInt(process.env.IP_RATE_LIMIT_MAX || "120", 10),
  windowMs: parseInt(process.env.IP_RATE_LIMIT_WINDOW || "60000", 10),
};

export const IMAGE_PROXY_RATE_LIMIT_CONFIG: IpRateLimitConfig = {
  maxRequests: parseInt(process.env.IMAGE_PROXY_RATE_LIMIT_MAX || "2500", 10),
  windowMs: parseInt(
    process.env.IMAGE_PROXY_RATE_LIMIT_WINDOW ||
      process.env.IP_RATE_LIMIT_WINDOW ||
      "60000",
    10,
  ),
};

export const ANALYTICS_EVENTS_RATE_LIMIT_CONFIG: IpRateLimitConfig = {
  maxRequests: parseInt(
    process.env.ANALYTICS_EVENTS_RATE_LIMIT_MAX || "240",
    10,
  ),
  windowMs: parseInt(
    process.env.ANALYTICS_EVENTS_RATE_LIMIT_WINDOW ||
      process.env.IP_RATE_LIMIT_WINDOW ||
      "60000",
    10,
  ),
};

export const AUTH_ROUTE_RATE_LIMIT_CONFIG: IpRateLimitConfig = {
  maxRequests: parseInt(process.env.AUTH_ROUTE_RATE_LIMIT_MAX || "60", 10),
  windowMs: parseInt(
    process.env.AUTH_ROUTE_RATE_LIMIT_WINDOW ||
      process.env.IP_RATE_LIMIT_WINDOW ||
      "60000",
    10,
  ),
};

export const PUBLIC_CRATE_RATE_LIMIT_CONFIG: IpRateLimitConfig = {
  maxRequests: parseInt(process.env.PUBLIC_CRATE_RATE_LIMIT_MAX || "120", 10),
  windowMs: parseInt(
    process.env.PUBLIC_CRATE_RATE_LIMIT_WINDOW ||
      process.env.IP_RATE_LIMIT_WINDOW ||
      "60000",
    10,
  ),
};

export const getIpRateLimitResponse = (
  request: NextRequest,
  config: IpRateLimitConfig,
): NextResponse | null => {
  const result = checkIpRateLimit(request, config);

  if (result.allowed) {
    return null;
  }

  return result.response;
};

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export function checkIpRateLimit(
  request: NextRequest,
  config: IpRateLimitConfig = DEFAULT_IP_RATE_LIMIT_CONFIG,
): { allowed: true } | { allowed: false; response: NextResponse } {
  const ip = getClientIp(request);
  const now = new Date();
  const entry = ipRateLimitStore.get(ip);

  if (ipRateLimitStore.size > 5000) {
    for (const [key, value] of ipRateLimitStore.entries()) {
      if (value.resetAt < now) {
        ipRateLimitStore.delete(key);
      }
    }
  }

  if (!entry || entry.resetAt < now) {
    ipRateLimitStore.set(ip, {
      count: 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000),
            ),
          },
        },
      ),
    };
  }

  entry.count += 1;
  ipRateLimitStore.set(ip, entry);
  return { allowed: true };
}
