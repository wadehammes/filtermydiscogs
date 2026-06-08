import classNames from "classnames";
import Button from "src/components/Button/Button.component";
import accessibilityStyles from "src/styles/accessibility.module.css";
import DiscogsLogo from "src/styles/icons/discogs-logo.svg";
import styles from "./LoginConnectButton.module.css";

type LoginConnectButtonProps = {
  className?: string | undefined;
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
};

export const LoginConnectButton = ({
  className,
  disabled = false,
  isLoading = false,
  onClick,
}: LoginConnectButtonProps) => (
  <Button
    variant="primary"
    size="lg"
    onClick={onClick}
    disabled={disabled}
    isLoading={isLoading}
    loadingText="Connecting..."
    className={classNames(styles.button, className)}
  >
    <span className={styles.label}>
      Connect with
      <DiscogsLogo className={styles.logo} aria-hidden />
      <span className={accessibilityStyles.visuallyHidden}>Discogs</span>
    </span>
  </Button>
);
