import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import { LoginSwitchAccountLink } from "src/components/LoginSwitchAccountLink/LoginSwitchAccountLink.component";
import { LOGIN_PAGE_UI_COPY } from "src/constants/loginPageCopy.registry";
import typography from "src/styles/modules/typography.module.css";
import styles from "./LoginBottomCta.module.css";

type LoginBottomCtaProps = {
  isLoading: boolean;
  reconnectUsername: string | null;
  onConnect: () => void;
  onConnectDifferentAccount: () => void;
};

export const LoginBottomCta = ({
  isLoading,
  reconnectUsername,
  onConnect,
  onConnectDifferentAccount,
}: LoginBottomCtaProps) => (
  <section className={styles.bottomCta} aria-labelledby="bottom-cta-heading">
    <h2 id="bottom-cta-heading" className={typography.subsectionHeading}>
      {LOGIN_PAGE_UI_COPY.bottomCtaHeading}
    </h2>
    <LoginConnectButton
      onClick={onConnect}
      disabled={isLoading}
      isLoading={isLoading}
      reconnectUsername={reconnectUsername}
      className={styles.loginButton}
    />
    {reconnectUsername ? (
      <LoginSwitchAccountLink
        onClick={onConnectDifferentAccount}
        disabled={isLoading}
      />
    ) : null}
  </section>
);
