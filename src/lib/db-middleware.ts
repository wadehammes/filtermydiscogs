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
