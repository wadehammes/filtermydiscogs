import "server-only";

import { prisma } from "src/lib/db";
import { definedProps } from "src/utils/definedProps";
import {
  contactEmailsMatch,
  normalizeContactEmail,
} from "src/utils/userContact.helpers";

export type ResolveBugReportReporterContactInput = {
  discogsUserId: number;
  submittedEmail?: string;
  submittedName?: string;
};

export type ResolvedBugReportReporterContact = {
  reporterEmail?: string;
  reporterName?: string;
};

export const resolveBugReportReporterContact = async (
  input: ResolveBugReportReporterContactInput,
): Promise<ResolvedBugReportReporterContact> => {
  const row = await prisma.user.findUnique({
    where: { discogs_user_id: input.discogsUserId },
    select: { email: true },
  });

  const storedEmail = normalizeContactEmail(row?.email);
  const submittedEmail = normalizeContactEmail(input.submittedEmail);
  const submittedName = input.submittedName?.trim() || undefined;

  const reporterEmail =
    storedEmail != null &&
    (submittedEmail == null || contactEmailsMatch(storedEmail, submittedEmail))
      ? storedEmail
      : undefined;

  return definedProps({
    reporterName: submittedName,
    reporterEmail,
  });
};
