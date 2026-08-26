import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminFromRequest } from "src/lib/admin-helpers";
import { getAdminStats } from "src/lib/admin-stats.server";
import { createErrorResponse } from "src/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminFromRequest(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await getAdminStats();

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return createErrorResponse(error);
  }
}
