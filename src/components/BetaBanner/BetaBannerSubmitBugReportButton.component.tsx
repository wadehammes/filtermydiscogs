"use client";

import classNames from "classnames";
import { SUBMIT_BUG_REPORT_NAV_LABEL } from "src/constants/sentryUserFeedback.constants";
import { runSubmitBugReport } from "src/lib/sentry/runSubmitBugReport.client";
import styles from "./BetaBannerSubmitBugReportButton.module.css";

export type BetaBannerSubmitBugReportButtonProps = {
  onSubmitBugReport?: () => void;
  className?: string;
};

export const BetaBannerSubmitBugReportButton = ({
  onSubmitBugReport,
  className,
}: BetaBannerSubmitBugReportButtonProps) => {
  return (
    <button
      type="button"
      className={classNames(styles.feedbackButton, className)}
      onClick={() => runSubmitBugReport(onSubmitBugReport)}
    >
      {SUBMIT_BUG_REPORT_NAV_LABEL}
    </button>
  );
};
