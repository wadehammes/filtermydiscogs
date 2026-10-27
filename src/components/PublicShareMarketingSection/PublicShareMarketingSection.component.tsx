"use client";

import Link from "next/link";
import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import { SITE_LEAD, SITE_NAME } from "src/constants/siteMetadata";
import { useAuth } from "src/context/auth.context";
import styles from "./PublicShareMarketingSection.module.css";

export const PublicShareMarketingSection = () => {
  const { login } = useAuth();

  return (
    <section
      className={styles.root}
      data-testid="fmdPublicShareMarketingSection"
      aria-labelledby="fmdPublicShareMarketingAboutHeading"
    >
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <h2
            className={styles.heading}
            id="fmdPublicShareMarketingAboutHeading"
          >
            About {SITE_NAME}
          </h2>
          <p className={styles.lede}>{SITE_LEAD}</p>
          <p className={styles.learnMore}>
            <Link href="/about" className={styles.inlineLink}>
              Learn more
            </Link>
          </p>
        </div>

        <aside
          className={styles.ctaCard}
          aria-labelledby="fmdPublicShareGetStartedHeading"
        >
          <h2
            className={styles.ctaHeading}
            id="fmdPublicShareGetStartedHeading"
          >
            Get started
          </h2>
          <p className={styles.ctaText}>
            Connect your Discogs account to start exploring and organizing your
            collection.
          </p>
          <div className={styles.ctaButtonWrap}>
            <LoginConnectButton
              onClick={login}
              className={styles.connectButton}
            />
          </div>
          <p className={styles.ctaNote}>
            <Link href="/legal" className={styles.inlineLink}>
              Terms & Privacy
            </Link>
          </p>
        </aside>
      </div>
    </section>
  );
};
