/**
 * Rate limiting middleware for database operations per user
 */

interface RateLimitEntry {
  userId: number;
  count: number;
  resetAt: Date;
}

const rateLimitStore = new Map<number, RateLimitEntry>();

/**
 * Rate limit configuration
 */
const RATE_LIMIT_CONFIG = {
  // Maximum number of database operations per window
  maxOperations: parseInt(process.env.DB_RATE_LIMIT_MAX || "100", 10),
  // Time window in milliseconds (default: 1 minute)
  windowMs: parseInt(process.env.DB_RATE_LIMIT_WINDOW || "60000", 10),
  // Maximum number of write operations per window
  maxWrites: parseInt(process.env.DB_RATE_LIMIT_MAX_WRITES || "20", 10),
};

/**
 * Check if a user has exceeded rate limits
 */
export function checkRateLimit(
  userId: number,
  isWriteOperation = false,
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = new Date();
  const entry = rateLimitStore.get(userId);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }

  // If no entry exists or window has expired, create new entry
  if (!entry || entry.resetAt < now) {
    const resetAt = new Date(now.getTime() + RATE_LIMIT_CONFIG.windowMs);
    const maxOps = isWriteOperation
      ? RATE_LIMIT_CONFIG.maxWrites
      : RATE_LIMIT_CONFIG.maxOperations;

    rateLimitStore.set(userId, {
      userId,
      count: 1,
      resetAt,
    });

    return {
      allowed: true,
      remaining: maxOps - 1,
      resetAt,
    };
  }

  // Check if limit exceeded
  const maxOps = isWriteOperation
    ? RATE_LIMIT_CONFIG.maxWrites
    : RATE_LIMIT_CONFIG.maxOperations;

  if (entry.count >= maxOps) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(userId, entry);

  return {
    allowed: true,
    remaining: maxOps - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a user (useful for testing or admin operations)
 */
export function resetRateLimit(userId: number): void {
  rateLimitStore.delete(userId);
}

/**
 * Get rate limit status for a user
 */
export function getRateLimitStatus(userId: number): {
  count: number;
  maxOperations: number;
  resetAt: Date;
} | null {
  const entry = rateLimitStore.get(userId);
  if (!entry) {
    return null;
  }

  const now = new Date();
  if (entry.resetAt < now) {
    rateLimitStore.delete(userId);
    return null;
  }

  return {
    count: entry.count,
    maxOperations: RATE_LIMIT_CONFIG.maxOperations,
    resetAt: entry.resetAt,
  };
}
