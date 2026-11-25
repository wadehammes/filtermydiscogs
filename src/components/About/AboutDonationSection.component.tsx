"use client";

import classNames from "classnames";
import { DonationCheckoutForm } from "src/components/DonationCheckoutForm/DonationCheckoutForm.component";
import { ABOUT_DONATION_BODY } from "src/constants/about.constants";
import { SITE_NAME } from "src/constants/siteMetadata";
import { SUPPORT_PROJECT_NAV_LABEL } from "src/constants/supportProjectToast.constants";
import typography from "src/styles/modules/typography.module.css";
import styles from "./About.module.css";

export const AboutDonationSection = () => (
  <section
    id="support"
    className={classNames(
      styles.tile,
      styles.tileSupport,
      styles.donationSection,
    )}
    aria-labelledby="about-support"
  >
    <div className={styles.donationCopy}>
      <p
        className={classNames(
          typography.sectionEyebrow,
          styles.donationEyebrow,
        )}
      >
        {SUPPORT_PROJECT_NAV_LABEL}
      </p>
      <h2
        id="about-support"
        className={classNames(styles.tileHeading, styles.donationHeading)}
      >
        Help keep {SITE_NAME} free
      </h2>
      <p className={styles.tileBody}>{ABOUT_DONATION_BODY}</p>
    </div>

    <DonationCheckoutForm />
  </section>
);
