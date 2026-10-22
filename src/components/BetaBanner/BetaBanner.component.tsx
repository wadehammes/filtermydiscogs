"use client";

import type { ReactNode } from "react";
import { BetaBannerSubmitBugReportButton } from "src/components/BetaBanner/BetaBannerSubmitBugReportButton.component";
import { resolveBetaBannerVisible } from "src/lib/sentry/resolveBetaBannerVisible";
import { definedProps } from "src/utils/definedProps";
import styles from "./BetaBanner.module.css";

export type BetaBannerProps = {
  bannerClassName: string;
  leading: ReactNode;
  onSubmitBugReport?: () => void;
  testId: string;
};

export const BetaBanner = ({
  bannerClassName,
  leading,
  onSubmitBugReport,
  testId,
}: BetaBannerProps) => {
  const showBanner = resolveBetaBannerVisible(onSubmitBugReport);

  if (!showBanner) {
    return null;
  }

  return (
    <div className={bannerClassName} role="status" data-testid={testId}>
      <p className={styles.text}>
        {leading} <span className={styles.betaLabel}>beta</span>. Something off?{" "}
        <BetaBannerSubmitBugReportButton
          {...definedProps({ onSubmitBugReport })}
        />
        .
      </p>
    </div>
  );
};
