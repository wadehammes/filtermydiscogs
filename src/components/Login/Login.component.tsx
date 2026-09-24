"use client";

import classNames from "classnames";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ErrorMessage } from "src/components/ErrorMessage/ErrorMessage.component";
import { LoginBottomCta } from "src/components/LoginBottomCta/LoginBottomCta.component";
import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import { LoginFeatureRow } from "src/components/LoginFeatureRow/LoginFeatureRow.component";
import { LoginSwitchAccountLink } from "src/components/LoginSwitchAccountLink/LoginSwitchAccountLink.component";
import {
  LOGIN_DEMO_PUBLIC_CRATE_PATH,
  LOGIN_PAGE_UI_COPY,
} from "src/constants/loginPageCopy.registry";
import { SITE_LEAD, SITE_NAME, SITE_TAGLINE } from "src/constants/siteMetadata";
import { useAuth } from "src/context/auth.context";
import accessibilityStyles from "src/styles/modules/accessibility.module.css";
import typography from "src/styles/modules/typography.module.css";
import styles from "./Login.module.css";
import { LoginPreviewDemo } from "./LoginPreviewDemo.component";
import { LOGIN_FEATURES } from "./loginFeatures.constants";

export const Login = () => {
  const { state, login } = useAuth();
  const { isLoading, error, isAuthenticated, reconnectUsername } = state;
  const router = useRouter();

  const connect = () => login();
  const connectDifferentAccount = () => login({ force: true });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/releases");
    }
  }, [isAuthenticated, router]);

  return (
    <div className={styles.landing} data-testid="fmdLogin">
      <div className={styles.heroShell}>
        <div className={styles.intro}>
          <div className={styles.heroPanel}>
            <hgroup className={styles.introHeading}>
              <h1
                id="login-heading"
                className={classNames(
                  typography.displayHeading,
                  styles.tagline,
                )}
              >
                <span className={accessibilityStyles.visuallyHidden}>
                  {SITE_NAME}
                </span>
                {SITE_TAGLINE}
              </h1>
              <p className={classNames(typography.lead, styles.subtitle)}>
                {SITE_LEAD}
              </p>
              <p
                className={classNames(
                  typography.metaCaption,
                  styles.publicCrateTeaser,
                )}
              >
                <Link
                  href={LOGIN_DEMO_PUBLIC_CRATE_PATH}
                  className={styles.publicCrateLink}
                >
                  {LOGIN_PAGE_UI_COPY.publicCrateLinkLabel}
                </Link>
                {LOGIN_PAGE_UI_COPY.publicCrateTeaserSuffix}
              </p>
            </hgroup>

            <section className={styles.hero} aria-labelledby="login-heading">
              {error ? <ErrorMessage message={error} /> : null}

              <LoginConnectButton
                onClick={connect}
                disabled={isLoading}
                isLoading={isLoading}
                reconnectUsername={reconnectUsername}
              />

              {reconnectUsername ? (
                <LoginSwitchAccountLink
                  onClick={connectDifferentAccount}
                  disabled={isLoading}
                />
              ) : null}

              <p
                className={classNames(typography.metaCaption, styles.finePrint)}
              >
                <Link href="/legal" className={styles.termsLink}>
                  {LOGIN_PAGE_UI_COPY.termsPrivacyLink}
                </Link>
                <span aria-hidden="true"> · </span>
                {LOGIN_PAGE_UI_COPY.finePrintFreePrefix}
                <Link href="/about" className={styles.supportLink}>
                  {LOGIN_PAGE_UI_COPY.finePrintSupportLink}
                </Link>
                {LOGIN_PAGE_UI_COPY.finePrintFreeSuffix}
              </p>
            </section>
          </div>

          <LoginPreviewDemo className={styles.heroMedia} />
        </div>
      </div>

      <div className={styles.pageBody}>
        <section
          aria-labelledby="login-features-heading"
          className={styles.features}
        >
          <div className={styles.featuresLead}>
            <svg
              aria-hidden="true"
              className={styles.featuresSoundwaves}
              preserveAspectRatio="none"
              viewBox="0 0 1200 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M0 24 C100 14 200 34 300 24 S500 14 600 24 700 34 800 24 900 14 1000 24 1100 34 1200 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0 28 C120 36 240 20 360 28 S560 36 680 28 800 20 920 28 1040 36 1200 28"
                fill="none"
                opacity="0.55"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <path
                d="M0 20 C80 12 160 28 240 20 S400 12 480 20 560 28 640 20 720 12 800 20 880 28 960 20 1040 12 1120 20 1200 28"
                fill="none"
                opacity="0.35"
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className={styles.featuresIntro}>
              <h2
                className={typography.subsectionHeading}
                id="login-features-heading"
              >
                {LOGIN_PAGE_UI_COPY.featuresSectionHeading}
              </h2>
              <p className={typography.bodyText}>
                {LOGIN_PAGE_UI_COPY.featuresSectionLede}
              </p>
            </div>
          </div>
          {LOGIN_FEATURES.map((feature, index) => (
            <LoginFeatureRow
              key={feature.title}
              feature={feature}
              index={index}
            />
          ))}
        </section>

        <LoginBottomCta
          isLoading={isLoading}
          reconnectUsername={reconnectUsername}
          onConnect={connect}
          onConnectDifferentAccount={connectDifferentAccount}
        />
      </div>
    </div>
  );
};
