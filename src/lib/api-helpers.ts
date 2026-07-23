import type { NextRequest, NextResponse } from "next/server";
import {
  getVerifiedUserFromRequest,
  type VerifiedDiscogsUser,
} from "src/lib/auth-request";
import { privateRouteJson } from "src/lib/private-route-response";
import { getPublicCrateMetadataForPage } from "src/lib/public-crate.server";
import { auditLog } from "./db-audit";
import { checkRateLimit } from "./rate-limit";

export type { VerifiedDiscogsUser };

export const createErrorResponse = (error: unknown): NextResponse => {
  const sanitized = sanitizeError(error);

  return privateRouteJson(
    { error: sanitized.message },
    { status: sanitized.status },
  );
};

export function sanitizeError(error: unknown): {
  message: string;
  code?: string;
  status: number;
} {
  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code);

    // Prisma error codes
    if (code === "P1001") {
      return {
        message: "Database connection failed",
        code: "DB_CONNECTION_ERROR",
        status: 503,
      };
    }

    if (code === "P2025") {
      return {
        message: "Record not found",
        code: "NOT_FOUND",
        status: 404,
      };
    }

    if (code === "P2002") {
      return {
        message: "Duplicate entry",
        code: "DUPLICATE_ENTRY",
        status: 409,
      };
    }
  }

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String(error.message)
        : "An error occurred";

  // Sanitize error messages - remove sensitive information
  const sanitized = errorMessage
    .replace(/DATABASE_URL[^;]*/gi, "DATABASE_URL=***")
    .replace(/password[=:][^\s]*/gi, "password=***")
    .replace(/connection string[^;]*/gi, "connection string=***");

  // Check for connection/resource errors
  if (
    sanitized.includes("Can't reach database") ||
    sanitized.includes("INSUFFICIENT RESOURCES") ||
    sanitized.includes("connection") ||
    sanitized.includes("timeout") ||
    sanitized.includes("P1001")
  ) {
    return {
      message: "Database connection error. Please try again in a moment",
      code: "DB_CONNECTION_ERROR",
      status: 503,
    };
  }

  // Check for Prisma initialization errors
  if (
    sanitized.includes("Prisma Client") ||
    sanitized.includes("Cannot find module '@prisma/client'")
  ) {
    return {
      message: "Database not initialized",
      code: "DB_NOT_INITIALIZED",
      status: 503,
    };
  }

  const isProduction = process.env.NODE_ENV === "production";

  return {
    message: isProduction ? "An unexpected error occurred" : sanitized,
    status: 500,
  };
}

/**
 * Resolve the authenticated user from verified OAuth tokens.
 */
export async function getVerifiedUserFromRequestWithRateLimit(
  request: NextRequest,
  isWriteOperation = false,
): Promise<
  | { user: VerifiedDiscogsUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const verified = await getVerifiedUserFromRequest(request);
  if ("error" in verified) {
    return verified;
  }

  const rateLimitError = checkRateLimitWithResponse(
    verified.user.userId,
    isWriteOperation,
  );
  if (rateLimitError) {
    return { error: rateLimitError };
  }

  return verified;
}

/**
 * Check rate limit and return error response if exceeded
 */
export function checkRateLimitWithResponse(
  userId: number,
  isWriteOperation = false,
): NextResponse | null {
  const rateLimit = checkRateLimit(userId, isWriteOperation);

  if (!rateLimit.allowed) {
    return privateRouteJson(
      {
        error: "Rate limit exceeded",
        details: `Too many requests. Please try again after ${new Date(rateLimit.resetAt).toISOString()}`,
        retryAfter: Math.ceil(
          (rateLimit.resetAt.getTime() - Date.now()) / 1000,
        ),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000),
          ),
          "X-RateLimit-Limit": String(isWriteOperation ? 20 : 100),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
        },
      },
    );
  }

  return null;
}

/**
 * Parse pagination parameters from request
 */
export function getPaginationParams(request: NextRequest): {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
} {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10)),
  );

  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    page,
    pageSize,
  };
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
) {
  const totalPages = Math.ceil(total / pageSize);

  return privateRouteJson({
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}

/**
 * Audit log wrapper for database operations
 */
export function auditDatabaseOperation(
  userId: number | null,
  model: string,
  action: "create" | "update" | "delete" | "bulk_delete",
  recordId?: string,
  metadata?: Record<string, unknown>,
): void {
  auditLog(
    userId,
    `${action.toUpperCase()} ${model}`,
    model,
    action,
    recordId,
    metadata,
  );
}

/**
 * Fetch public crate data for server-side use (e.g., in generateMetadata)
 * Uses internal API route
 */
export async function fetchPublicCrateMetadata(crateId: string): Promise<{
  crate: { name: string; username: string | null };
  pagination: { total: number };
} | null> {
  return getPublicCrateMetadataForPage(crateId);
}
