import { NextResponse } from "next/server";
import { getPoolMetrics, prisma } from "src/lib/db";
import { getAuditStats } from "src/lib/db-audit";
import { getQueryPatterns, getQueryStats } from "src/lib/db-middleware";

/**
 * Health check endpoint for debugging production issues
 * Includes performance metrics and monitoring data
 */
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    prismaClientStatus: "unknown",
  };

  try {
    const startTime = Date.now();
    // Test a simple query (connection pool handles connections automatically)
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const queryDuration = Date.now() - startTime;

    diagnostics.prismaClientStatus = "connected";
    diagnostics.databaseQuery = "success";
    diagnostics.testQueryResult = result;
    diagnostics.queryDuration = `${queryDuration}ms`;

    // Test if we can query crates table
    try {
      const crateCount = await prisma.crate.count();
      diagnostics.crateTableAccessible = true;
      diagnostics.crateCount = crateCount;
    } catch (error) {
      diagnostics.crateTableAccessible = false;
      diagnostics.crateTableError =
        error instanceof Error ? error.message : String(error);
    }

    // Add connection pool metrics
    const poolMetrics = getPoolMetrics();
    if (poolMetrics) {
      diagnostics.poolMetrics = poolMetrics;
    }

    // Add query performance statistics
    const queryStats = getQueryStats();
    diagnostics.queryStats = queryStats;

    // Add query patterns (only in development or if explicitly enabled)
    if (
      process.env.NODE_ENV === "development" ||
      process.env.DB_ENABLE_DIAGNOSTICS === "true"
    ) {
      diagnostics.queryPatterns = getQueryPatterns();
      diagnostics.auditStats = getAuditStats();
    }
  } catch (error) {
    diagnostics.prismaClientStatus = "error";
    // Sanitize error to prevent information leakage
    const errorMessage = error instanceof Error ? error.message : String(error);
    diagnostics.error = errorMessage
      .replace(/DATABASE_URL[^;]*/gi, "DATABASE_URL=***")
      .replace(/password[=:][^\s]*/gi, "password=***");
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.prismaClientStatus === "connected" ? 200 : 500,
  });
}
