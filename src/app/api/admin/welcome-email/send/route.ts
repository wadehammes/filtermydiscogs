import { type NextRequest, NextResponse } from "next/server";
import { verifyAdminFromRequest } from "src/lib/admin-helpers";
import {
  AdminWelcomeEmailSendFailedError,
  sendAdminWelcomeEmailForUser,
} from "src/lib/admin-welcome-email-pending.server";
import {
  createErrorResponse,
  rethrowNextInternalError,
} from "src/lib/api-helpers";
import { adminWelcomeEmailSendBodySchema } from "src/lib/validation/adminWelcomeEmail.schemas";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdminFromRequest(request);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsedBody = await parseRequestBody(
      request,
      adminWelcomeEmailSendBodySchema,
      {
        invalidJsonMessage: "Invalid JSON body",
      },
    );
    if ("error" in parsedBody) {
      return NextResponse.json({ error: parsedBody.error }, { status: 400 });
    }

    const { discogsUserId } = parsedBody.data;

    try {
      await sendAdminWelcomeEmailForUser(discogsUserId);
    } catch (error) {
      if (error instanceof AdminWelcomeEmailSendFailedError) {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }
      throw error;
    }

    return NextResponse.json({ sent: true, discogsUserId });
  } catch (error) {
    rethrowNextInternalError(error);
    return createErrorResponse(error, {
      route: "/api/admin/welcome-email/send",
    });
  }
}
