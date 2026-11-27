import type { NextRequest } from "next/server";
import { getVerifiedUserFromRequestWithRateLimit } from "src/lib/api-helpers";
import { runContactRouteSideEffect } from "src/lib/contactRouteSideEffects.server";
import { privateRouteJson } from "src/lib/private-route-response";
import { resolveBugReportReporterContact } from "src/lib/resolveBugReportReporterContact.server";
import { sendBugReportNotificationEmails } from "src/lib/sendBugReportNotificationEmails.server";
import { parseRequestBody } from "src/lib/validation/parseRequestBody";
import { userBugReportNotificationBodySchema } from "src/lib/validation/userBugReportNotification.schemas";
import { definedProps } from "src/utils/definedProps";

const BUG_REPORT_NOTIFICATION_ROUTE = "/api/user/bug-report-notification";

export async function POST(request: NextRequest) {
  const verified = await getVerifiedUserFromRequestWithRateLimit(request, true);
  if ("error" in verified) {
    return verified.error;
  }

  const parsedBody = await parseRequestBody(
    request,
    userBugReportNotificationBodySchema,
    { invalidJsonMessage: "Invalid JSON body" },
  );
  if ("error" in parsedBody) {
    return privateRouteJson({ error: parsedBody.error }, { status: 400 });
  }

  const body = parsedBody.data;
  const contact = await resolveBugReportReporterContact({
    discogsUserId: verified.user.userId,
    ...definedProps({
      submittedEmail: body.email,
      submittedName: body.name,
    }),
  });

  runContactRouteSideEffect(
    sendBugReportNotificationEmails({
      message: body.message,
      username: verified.user.username,
      discogsUserId: String(verified.user.userId),
      ...definedProps({
        feedbackSourceTag: body.feedbackSourceTag,
        reporterName: contact.reporterName,
        reporterEmail: contact.reporterEmail,
      }),
    }),
    "Bug report notification email failed:",
    BUG_REPORT_NOTIFICATION_ROUTE,
  );

  return privateRouteJson({ success: true });
}
