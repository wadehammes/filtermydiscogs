import { type NextRequest, NextResponse } from "next/server";
import { auditLog } from "./db-audit";
import { checkRateLimit } from "./rate-limit";

/**
 * Sanitize error messages to prevent information leakage
 */
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

  return {
    message: sanitized,
    status: 500,
  };
}

/**
 * Get user ID from request with validation
 */
export function getUserIdFromRequest(
  request: NextRequest,
): { userId: number; error?: never } | { userId?: never; error: NextResponse } {
  const userId = request.cookies.get("discogs_user_id")?.value;

  if (!userId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const userIdNum = parseInt(userId, 10);
  if (Number.isNaN(userIdNum)) {
    return {
      error: NextResponse.json({ error: "Invalid user ID" }, { status: 400 }),
    };
  }

  return { userId: userIdNum };
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
    return NextResponse.json(
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

  return NextResponse.json({
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
