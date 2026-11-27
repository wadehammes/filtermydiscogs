import { FetchMethods, fetchOptions, fetchResponse } from "src/api/helpers";
import type { UserBugReportNotificationBody } from "src/lib/validation/userBugReportNotification.schemas";

export const notifyBugReportReceipt = async (
  body: UserBugReportNotificationBody,
): Promise<void> => {
  await fetchResponse(
    fetch(
      "/api/user/bug-report-notification",
      fetchOptions({
        method: FetchMethods.Post,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    ),
  );
};
