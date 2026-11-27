import { SITE_NAME } from "src/constants/siteMetadata";

export const BUG_REPORT_RECEIVED_EMAIL_SUBJECT = `We received your ${SITE_NAME} bug report`;

export const BUG_REPORT_SUPPORT_EMAIL_SUBJECT_PREFIX = `${SITE_NAME} bug report`;

export const buildBugReportReceivedPreview = (username?: string): string =>
  username
    ? `Thanks, ${username}. We received your bug report.`
    : "We received your bug report.";

export const buildBugReportSupportPreview = (
  feedbackSourceTag?: string,
  username?: string,
): string => {
  const parts = [BUG_REPORT_SUPPORT_EMAIL_SUBJECT_PREFIX];
  if (feedbackSourceTag) {
    parts.push(`(${feedbackSourceTag})`);
  }
  if (username) {
    parts.push(`from ${username}`);
  }
  return parts.join(" ");
};

export const bugReportReceivedEmailCopy = {
  greeting: (username?: string): string =>
    username ? `Hi ${username},` : "Hi there,",
  body: "Thanks for sending a bug report. We received it and are looking into it.",
  footnote:
    "If you included steps to reproduce or a screenshot, we will use those details as we investigate.",
} as const;

export const bugReportSupportEmailCopy = {
  reportHeading: "Report",
  discogsUserLabel: "Discogs user",
  nameLabel: "Name",
  replyToLabel: "Reply to",
  sourceLabel: "Source",
} as const;
