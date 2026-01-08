/**
 * Configuration for query monitoring
 */
const QUERY_CONFIG = {
  slowQueryThreshold: parseInt(
    process.env.DB_SLOW_QUERY_THRESHOLD || "100",
    10,
  ), // milliseconds
  queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || "30000", 10), // milliseconds
  enableQueryLogging:
    process.env.NODE_ENV === "development" ||
    process.env.DB_LOG_QUERIES === "true",
};

/**
 * Query performance metrics
 */
interface QueryMetrics {
  model: string;
  action: string;
  duration: number;
  timestamp: Date;
  slow: boolean;
}

const queryMetrics: QueryMetrics[] = [];

/**
 * Wrap a Prisma query with logging and timeout monitoring
 * Use this to instrument specific queries
 */
export async function instrumentQuery<T>(
  model: string,
  action: string,
  queryFn: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now();

  // Create a timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          `Query timeout: ${model}.${action} exceeded ${QUERY_CONFIG.queryTimeout}ms`,
        ),
      );
    }, QUERY_CONFIG.queryTimeout);
  });

  try {
    // Race the query against the timeout
    const result = await Promise.race([queryFn(), timeoutPromise]);

    const duration = Date.now() - startTime;
    const isSlow = duration > QUERY_CONFIG.slowQueryThreshold;

    // Log slow queries
    if (isSlow) {
      console.warn(
        `[DB] Slow query detected: ${model}.${action} took ${duration}ms`,
        {
          model,
          action,
          duration,
        },
      );
    }

    // Log all queries in development
    if (QUERY_CONFIG.enableQueryLogging) {
      console.log(`[DB] Query: ${model}.${action} (${duration}ms)`);
    }

    // Store metrics (keep last 100 queries)
    queryMetrics.push({
      model,
      action,
      duration,
      timestamp: new Date(),
      slow: isSlow,
    });

    if (queryMetrics.length > 100) {
      queryMetrics.shift();
    }

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[DB] Query error: ${model}.${action} (${duration}ms)`,
      error instanceof Error ? error.message : String(error),
    );

    // Don't expose internal Prisma errors
    if (error instanceof Error) {
      const sanitizedError = new Error("Database operation failed");
      sanitizedError.name = error.name;
      throw sanitizedError;
    }

    throw error;
  }
}

/**
 * Get query performance statistics
 */
export function getQueryStats() {
  if (queryMetrics.length === 0) {
    return {
      totalQueries: 0,
      averageDuration: 0,
      slowQueries: 0,
      slowQueryPercentage: 0,
    };
  }

  const totalQueries = queryMetrics.length;
  const totalDuration = queryMetrics.reduce((sum, m) => sum + m.duration, 0);
  const slowQueries = queryMetrics.filter((m) => m.slow).length;

  return {
    totalQueries,
    averageDuration: Math.round(totalDuration / totalQueries),
    slowQueries,
    slowQueryPercentage: Math.round((slowQueries / totalQueries) * 100),
    recentSlowQueries: queryMetrics
      .filter((m) => m.slow)
      .slice(-10)
      .map((m) => ({
        model: m.model,
        action: m.action,
        duration: m.duration,
        timestamp: m.timestamp.toISOString(),
      })),
  };
}

/**
 * Get query patterns (most common queries)
 */
export function getQueryPatterns() {
  const patterns = new Map<string, number>();

  for (const metric of queryMetrics) {
    const key = `${metric.model}.${metric.action}`;
    patterns.set(key, (patterns.get(key) || 0) + 1);
  }

  return Array.from(patterns.entries())
    .map(([pattern, count]) => ({ pattern, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

// Note: Prisma 7+ doesn't support $use middleware
// Instead, we'll wrap queries manually where needed
// For now, we'll skip automatic middleware initialization
// and rely on manual instrumentation in route handlers
// setupPrismaMiddleware();
