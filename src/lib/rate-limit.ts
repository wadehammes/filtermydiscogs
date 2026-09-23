interface RateLimitEntry {
  userId: number;
  readCount: number;
  writeCount: number;
  resetAt: Date;
}

const rateLimitStore = new Map<number, RateLimitEntry>();

const RATE_LIMIT_CONFIG = {
  maxOperations: parseInt(process.env.DB_RATE_LIMIT_MAX || "100", 10),
  windowMs: parseInt(process.env.DB_RATE_LIMIT_WINDOW || "60000", 10),
  maxWrites: parseInt(process.env.DB_RATE_LIMIT_MAX_WRITES || "60", 10),
};

const cleanupExpiredEntries = (now: Date) => {
  if (rateLimitStore.size <= 1000) {
    return;
  }

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
};

export function checkRateLimit(
  userId: number,
  isWriteOperation = false,
): { allowed: boolean; remaining: number; resetAt: Date } {
  const now = new Date();
  cleanupExpiredEntries(now);

  const maxOps = isWriteOperation
    ? RATE_LIMIT_CONFIG.maxWrites
    : RATE_LIMIT_CONFIG.maxOperations;

  let entry = rateLimitStore.get(userId);

  if (!entry || entry.resetAt < now) {
    const resetAt = new Date(now.getTime() + RATE_LIMIT_CONFIG.windowMs);
    entry = {
      userId,
      readCount: isWriteOperation ? 0 : 1,
      writeCount: isWriteOperation ? 1 : 0,
      resetAt,
    };
    rateLimitStore.set(userId, entry);

    return {
      allowed: true,
      remaining: maxOps - 1,
      resetAt,
    };
  }

  const currentCount = isWriteOperation ? entry.writeCount : entry.readCount;

  if (currentCount >= maxOps) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  if (isWriteOperation) {
    entry.writeCount += 1;
  } else {
    entry.readCount += 1;
  }

  rateLimitStore.set(userId, entry);

  const nextCount = isWriteOperation ? entry.writeCount : entry.readCount;

  return {
    allowed: true,
    remaining: maxOps - nextCount,
    resetAt: entry.resetAt,
  };
}
