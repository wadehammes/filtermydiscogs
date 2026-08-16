import type { NextRequest } from "next/server";
import { verifyAdminFromRequest } from "src/lib/admin-helpers";
import { getPoolMetrics, prisma } from "src/lib/db";
import { getAuditStats } from "src/lib/db-audit";
import { getQueryPatterns, getQueryStats } from "src/lib/db-middleware";
import { privateRouteJson } from "src/lib/private-route-response";

/**
 * Admin-only health check for debugging production issues.
 */
export async function GET(request: NextRequest) {
  const isAdmin = await verifyAdminFromRequest(request);

  if (!isAdmin) {
    return privateRouteJson({ error: "Forbidden" }, { status: 403 });
  }

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    prismaClientStatus: "unknown",
  };

  try {
    const startTime = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const queryDuration = Date.now() - startTime;

    diagnostics.prismaClientStatus = "connected";
    diagnostics.databaseQuery = "success";
    diagnostics.testQueryResult = result;
    diagnostics.queryDuration = `${queryDuration}ms`;

    try {
      const crateCount = await prisma.crate.count();
      diagnostics.crateTableAccessible = true;
      diagnostics.crateCount = crateCount;
    } catch (error) {
      diagnostics.crateTableAccessible = false;
      diagnostics.crateTableError =
        error instanceof Error ? error.message : String(error);
    }

    const poolMetrics = getPoolMetrics();
    if (poolMetrics) {
      diagnostics.poolMetrics = poolMetrics;
    }

    diagnostics.queryStats = getQueryStats();

    if (
      process.env.NODE_ENV === "development" ||
      process.env.DB_ENABLE_DIAGNOSTICS === "true"
    ) {
      diagnostics.queryPatterns = getQueryPatterns();
      diagnostics.auditStats = getAuditStats();
    }
  } catch (error) {
    diagnostics.prismaClientStatus = "error";
    const errorMessage = error instanceof Error ? error.message : String(error);
    diagnostics.error = errorMessage
      .replace(/DATABASE_URL[^;]*/gi, "DATABASE_URL=***")
      .replace(/password[=:][^\s]*/gi, "password=***");
  }

  return privateRouteJson(diagnostics, {
    status: diagnostics.prismaClientStatus === "connected" ? 200 : 500,
  });
}
