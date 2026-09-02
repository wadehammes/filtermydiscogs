"use client";

import classNames from "classnames";
import Link from "next/link";
import { LoginFeatureVisual } from "src/components/Login/LoginFeatureVisual.component";
import { LOGIN_FEATURES } from "src/components/Login/loginFeatures.constants";
import {
  ABOUT_GITHUB_LINKS,
  ABOUT_SUPPORT_EMAIL,
} from "src/constants/about.constants";
import { SITE_NAME } from "src/constants/siteMetadata";
import { SUPPORT_SECTION_ID } from "src/constants/supportProjectToast.constants";
import { useHashScrollOnMount } from "src/hooks/useHashScrollOnMount.hook";
import FMDIcon from "src/styles/icons/fmd-icon.svg";
import typography from "src/styles/modules/typography.module.css";
import styles from "./About.module.css";
import { AboutClearDataSection } from "./AboutClearDataSection.component";
import { AboutDonationSection } from "./AboutDonationSection.component";

export function AboutClient() {
  useHashScrollOnMount(SUPPORT_SECTION_ID);

  return (
    <div className={styles.page} data-testid="fmdAbout">
      <div className={styles.bento}>
        <header className={classNames(styles.tile, styles.tileIntro)}>
          <div className={styles.introBrand}>
            <FMDIcon aria-label={SITE_NAME} className={styles.introIcon} />
          </div>
          <div className={styles.introCopy} data-prose-flow>
            <div className={styles.introTitle}>
              <p className={typography.brandEyebrow}>About</p>
              <h1 className={styles.tileHeading}>
                Your Discogs collection, unlocked
              </h1>
            </div>
            <p>
              Discogs is where your collection lives. FilterMyDiscogs is the
              free app I built to help you dig through it: search, filter, queue
              tracks, pack crates, spot trends, and more.
            </p>
          </div>
          <p className={classNames(typography.metaCaption, styles.introFooter)}>
            <Link href="/legal" className={styles.link}>
              Terms & Privacy
            </Link>
          </p>
        </header>

        {LOGIN_FEATURES.map((feature) => (
          <article
            key={feature.title}
            className={classNames(styles.tile, styles.tileFeature)}
          >
            <LoginFeatureVisual
              className={styles.featureVisual}
              imageBase={feature.imageBase}
              alt={feature.imageAlt}
              themeIndependent={feature.themeIndependent}
            />
            <div className={styles.tileFeatureCopy}>
              <p className={typography.sectionEyebrow}>{feature.eyebrow}</p>
              <h2 className={styles.tileTitle}>{feature.title}</h2>
              <p className={classNames(styles.tileBody, styles.tileBodyClamp)}>
                {feature.description}
              </p>
            </div>
          </article>
        ))}

        <AboutDonationSection />

        <div className={styles.utilityRow}>
          <div className={styles.utilityStack}>
            <article className={classNames(styles.tile, styles.tileGithub)}>
              <p className={typography.sectionEyebrow}>Code</p>
              <h2 className={styles.tileTitle}>Open source</h2>
              <p className={styles.tileBody}>
                Fork it, fix it, or send a PR. MIT licensed.
              </p>
              <a
                href={ABOUT_GITHUB_LINKS.repo}
                target="_blank"
                rel="noopener noreferrer"
                className={classNames(styles.link, styles.tileLink)}
              >
                View on GitHub
              </a>
            </article>

            <article className={classNames(styles.tile, styles.tileContact)}>
              <p className={typography.sectionEyebrow}>Contact</p>
              <h2 className={styles.tileTitle}>Get in touch</h2>
              <dl className={styles.contactList}>
                <div className={styles.contactItem}>
                  <dt>Email</dt>
                  <dd>
                    <a
                      className={styles.link}
                      href={`mailto:${ABOUT_SUPPORT_EMAIL}`}
                    >
                      {ABOUT_SUPPORT_EMAIL}
                    </a>
                  </dd>
                </div>
                <div className={styles.contactItem}>
                  <dt>Ideas</dt>
                  <dd>
                    <a
                      className={styles.link}
                      href={ABOUT_GITHUB_LINKS.discussions}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Discussions
                    </a>
                  </dd>
                </div>
                <div className={styles.contactItem}>
                  <dt>Bugs</dt>
                  <dd>
                    <a
                      className={styles.link}
                      href={ABOUT_GITHUB_LINKS.issues}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Issues
                    </a>
                  </dd>
                </div>
              </dl>
            </article>
          </div>

          <AboutClearDataSection />
        </div>
      </div>
    </div>
  );
}
