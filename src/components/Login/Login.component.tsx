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
import { LOGIN_PAGE_UI_COPY } from "src/constants/loginPageCopy.registry";
import { SITE_LEAD, SITE_NAME, SITE_TAGLINE } from "src/constants/siteMetadata";
import { useAuth } from "src/context/auth.context";
import accessibilityStyles from "src/styles/accessibility.module.css";
import FMDIcon from "src/styles/icons/fmd-icon.svg";
import typography from "src/styles/typography.module.css";
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
      <div className={styles.intro}>
        <hgroup className={styles.introHeading}>
          <FMDIcon aria-label="Filter My Discogs" />
          <h1
            id="login-heading"
            className={classNames(typography.displayHeading, styles.tagline)}
          >
            <span className={accessibilityStyles.visuallyHidden}>
              {SITE_NAME}
            </span>
            {SITE_TAGLINE}
          </h1>
          <p className={classNames(typography.lead, styles.subtitle)}>
            {SITE_LEAD}
          </p>
        </hgroup>

        <LoginPreviewDemo />

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

          <p className={classNames(typography.metaCaption, styles.finePrint)}>
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

      <div className={styles.features}>
        {LOGIN_FEATURES.map((feature, index) => (
          <LoginFeatureRow
            key={feature.title}
            feature={feature}
            index={index}
          />
        ))}
      </div>

      <LoginBottomCta
        isLoading={isLoading}
        reconnectUsername={reconnectUsername}
        onConnect={connect}
        onConnectDifferentAccount={connectDifferentAccount}
      />
    </div>
  );
};
