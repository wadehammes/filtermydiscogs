"use client";

import Link from "next/link";
import Button from "src/components/Button/Button.component";
import { useAnalyticsConsent } from "src/context/analyticsConsent.context";
import styles from "./CookieConsentBanner.module.css";

export const CookieConsentBanner = () => {
  const { isReady, hasChosen, acceptAnalytics, rejectAnalytics } =
    useAnalyticsConsent();

  if (!isReady || hasChosen) {
    return null;
  }

  return (
    <section
      className={styles.banner}
      aria-label="Cookie consent"
      aria-live="polite"
      data-testid="fmdCookieConsentBanner"
    >
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.title}>Analytics cookies</p>
          <p className={styles.description}>
            We use optional analytics cookies through Google Tag Manager to
            understand how the app is used. Essential cookies for Discogs login
            always apply. See our{" "}
            <Link href="/legal#cookies" className={styles.link}>
              cookie notice
            </Link>{" "}
            for details.
          </p>
        </div>
        <div className={styles.actions}>
          <Button variant="primary" size="md" onPress={acceptAnalytics}>
            Accept analytics
          </Button>
          <Button variant="secondary" size="md" onPress={rejectAnalytics}>
            Essential only
          </Button>
        </div>
      </div>
    </section>
  );
};
