import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import typography from "src/styles/typography.module.css";
import styles from "./LoginBottomCta.module.css";

type LoginBottomCtaProps = {
  isLoading: boolean;
  onConnect: () => void;
};

export const LoginBottomCta = ({
  isLoading,
  onConnect,
}: LoginBottomCtaProps) => (
  <section className={styles.bottomCta} aria-labelledby="bottom-cta-heading">
    <h2 id="bottom-cta-heading" className={typography.subsectionHeading}>
      Ready to explore your collection?
    </h2>
    <LoginConnectButton
      onClick={onConnect}
      disabled={isLoading}
      isLoading={isLoading}
      className={styles.loginButton}
    />
  </section>
);
