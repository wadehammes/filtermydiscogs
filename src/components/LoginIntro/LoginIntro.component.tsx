import classNames from "classnames";
import Link from "next/link";
import { ErrorMessage } from "src/components/ErrorMessage/ErrorMessage.component";
import { LoginPreviewDemo } from "src/components/Login/LoginPreviewDemo.component";
import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import { LoginSwitchAccountLink } from "src/components/LoginSwitchAccountLink/LoginSwitchAccountLink.component";
import FMDIcon from "src/styles/icons/fmd-icon.svg";
import typography from "src/styles/typography.module.css";
import styles from "./LoginIntro.module.css";

type LoginIntroProps = {
  error: string | null;
  isLoading: boolean;
  reconnectUsername: string | null;
  onConnect: () => void;
  onConnectDifferentAccount: () => void;
};

export const LoginIntro = ({
  error,
  isLoading,
  reconnectUsername,
  onConnect,
  onConnectDifferentAccount,
}: LoginIntroProps) => (
  <div className={styles.intro}>
    <hgroup className={styles.introHeading}>
      <FMDIcon aria-label="Filter My Discogs" />
      <h1
        id="login-heading"
        className={classNames(typography.displayHeading, styles.tagline)}
      >
        Digging made easier.
      </h1>
      <p className={classNames(typography.lead, styles.subtitle)}>
        Browse and filter your collection, build crates, explore insights, and
        share cover-art mosaics.
      </p>
    </hgroup>

    <LoginPreviewDemo />

    <section className={styles.hero} aria-labelledby="login-heading">
      {error ? <ErrorMessage message={error} /> : null}

      <LoginConnectButton
        onClick={onConnect}
        disabled={isLoading}
        isLoading={isLoading}
        reconnectUsername={reconnectUsername}
      />

      {reconnectUsername ? (
        <LoginSwitchAccountLink
          onClick={onConnectDifferentAccount}
          disabled={isLoading}
        />
      ) : null}

      <p className={classNames(typography.metaCaption, styles.finePrint)}>
        <Link href="/legal" className={styles.termsLink}>
          Terms & Privacy
        </Link>
        <span aria-hidden="true"> · </span>
        Free to use (
        <Link href="/about" className={styles.supportLink}>
          support is greatly appreciated
        </Link>
        )
      </p>
    </section>
  </div>
);
