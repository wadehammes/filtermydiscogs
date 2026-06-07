import { type NextRequest, NextResponse } from "next/server";

interface IpRateLimitEntry {
  count: number;
  resetAt: Date;
}

const ipRateLimitStore = new Map<string, IpRateLimitEntry>();

const IP_RATE_LIMIT_CONFIG = {
  maxRequests: parseInt(process.env.IP_RATE_LIMIT_MAX || "120", 10),
  windowMs: parseInt(process.env.IP_RATE_LIMIT_WINDOW || "60000", 10),
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
      resetAt: new Date(now.getTime() + IP_RATE_LIMIT_CONFIG.windowMs),
    });
    return { allowed: true };
  }

  if (entry.count >= IP_RATE_LIMIT_CONFIG.maxRequests) {
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
