import { NextResponse } from "next/server";
import { prisma } from "src/lib/db";

/**
 * Health check endpoint for debugging production issues
 */
export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlLength: process.env.DATABASE_URL?.length || 0,
    prismaClientStatus: "unknown",
  };

  try {
    // Test a simple query (connection pool handles connections automatically)
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    diagnostics.prismaClientStatus = "connected";
    diagnostics.databaseQuery = "success";
    diagnostics.testQueryResult = result;

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
  } catch (error) {
    diagnostics.prismaClientStatus = "error";
    diagnostics.error = error instanceof Error ? error.message : String(error);
    diagnostics.errorStack = error instanceof Error ? error.stack : undefined;
  }

  return NextResponse.json(diagnostics, {
    status: diagnostics.prismaClientStatus === "connected" ? 200 : 500,
  });
}
