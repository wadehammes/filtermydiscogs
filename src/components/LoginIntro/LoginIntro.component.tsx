import classNames from "classnames";
import Link from "next/link";
import { ErrorMessage } from "src/components/ErrorMessage/ErrorMessage.component";
import { LoginPreviewDemo } from "src/components/Login/LoginPreviewDemo.component";
import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import typography from "src/styles/typography.module.css";
import styles from "./LoginIntro.module.css";

type LoginIntroProps = {
  error: string | null;
  isLoading: boolean;
  onConnect: () => void;
};

export const LoginIntro = ({
  error,
  isLoading,
  onConnect,
}: LoginIntroProps) => (
  <div className={styles.intro}>
    <hgroup className={styles.introHeading}>
      <p className={typography.brandEyebrow}>FilterMyDiscogs</p>
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
        className={styles.loginButton}
      />

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
