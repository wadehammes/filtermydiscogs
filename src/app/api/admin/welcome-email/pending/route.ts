import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminFromRequest } from "src/lib/admin-helpers";
import { listAdminWelcomeEmailPendingUsers } from "src/lib/admin-welcome-email-pending.server";
import {
  createErrorResponse,
  rethrowNextInternalError,
} from "src/lib/api-helpers";

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminFromRequest(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await listAdminWelcomeEmailPendingUsers();

    return NextResponse.json(
      { users },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      },
    );
  } catch (error) {
    rethrowNextInternalError(error);
    return createErrorResponse(error, {
      route: "/api/admin/welcome-email/pending",
    });
  }
}
